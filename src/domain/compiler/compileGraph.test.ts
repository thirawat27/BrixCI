import { describe, expect, it } from 'vitest'
import { createJobNode, createStepNode, createTriggerNode } from '../graph/factories'
import { compileGraphToYaml } from './compileGraph'
import { createDefaultGraph } from '../templates/defaultGraph'

describe('compile graph to github actions yaml', () => {
  it('compiles default graph and includes jobs + steps', () => {
    const graph = createDefaultGraph()
    const result = compileGraphToYaml(graph, 'Unit Test Workflow')

    expect(result.workflow.name).toBe('Unit Test Workflow')
    expect(result.workflow.jobs.build_test).toBeDefined()
    expect(result.workflow.jobs.build_test.steps.length).toBeGreaterThan(0)
    expect(result.yaml).toContain('name: Unit Test Workflow')
    expect(result.yaml).toContain('runs-on: ubuntu-latest')
    expect(result.yaml).toContain('actions/checkout@v4')
  })

  it('includes workflow env, job env, step env, and matrix strategy', () => {
    const trigger = createTriggerNode({ id: 'trigger', position: { x: 0, y: 0 } })
    const job = createJobNode(
      { id: 'job-build', position: { x: 1, y: 0 } },
      {
        label: 'Build Matrix',
        jobId: 'build',
        runsOn: '${{ matrix.os }}',
        env: {
          NODE_ENV: 'production',
        },
        strategyMatrix: {
          node: ['18', '20'],
          os: ['ubuntu-latest', 'windows-latest'],
        },
        strategyFailFast: false,
      },
    )
    const step = createStepNode(
      { id: 'step-test', position: { x: 2, y: 0 } },
      {
        label: 'Run Tests',
        mode: 'run',
        runCommand: 'npm test',
        jobNodeId: job.id,
        env: {
          CI: 'true',
        },
      },
    )

    const result = compileGraphToYaml(
      {
        nodes: [trigger, job, step],
        edges: [
          { id: 'edge-trigger-job', source: trigger.id, target: job.id },
          { id: 'edge-job-step', source: job.id, target: step.id },
        ],
      },
      'Matrix Workflow',
      {
        LOG_LEVEL: 'debug',
      },
    )

    expect(result.workflow.env).toEqual({ LOG_LEVEL: 'debug' })
    expect(result.workflow.jobs.build.env).toEqual({ NODE_ENV: 'production' })
    expect(result.workflow.jobs.build.strategy).toEqual({
      matrix: {
        node: ['18', '20'],
        os: ['ubuntu-latest', 'windows-latest'],
      },
      'fail-fast': false,
    })
    expect(result.workflow.jobs.build.steps[0].env).toEqual({ CI: 'true' })
    expect(result.yaml).toContain('fail-fast: false')
    expect(result.yaml).toContain('LOG_LEVEL: debug')
  })
})
