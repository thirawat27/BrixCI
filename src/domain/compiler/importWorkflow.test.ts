import { describe, expect, it } from 'vitest'
import { validateGraph } from '../graph'
import { compileGraphToYaml } from './compileGraph'
import { parseWorkflowYaml } from './importWorkflow'

describe('import github actions yaml', () => {
  it('parses a supported workflow into a valid graph and preserves compile semantics', () => {
    const result = parseWorkflowYaml(`
name: Release Pipeline
env:
  LOG_LEVEL: debug
on:
  push:
    branches:
      - main
  workflow_dispatch:
jobs:
  build:
    name: Build
    runs-on: ubuntu-latest
    env:
      NODE_ENV: production
    strategy:
      fail-fast: false
      matrix:
        node:
          - '18'
          - '20'
        os:
          - ubuntu-latest
          - windows-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Dependencies
        run: npm ci
  test:
    name: Run Tests
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Execute Tests
        run: npm test
        env:
          CI: 'true'
`)

    const issues = validateGraph(result.graph)
    const compiled = compileGraphToYaml(result.graph, result.workflowName, result.workflowEnv)

    expect(result.workflowName).toBe('Release Pipeline')
    expect(result.workflowEnv).toEqual({ LOG_LEVEL: 'debug' })
    expect(result.graph.nodes.filter((node) => node.type === 'trigger')).toHaveLength(2)
    expect(result.graph.nodes.filter((node) => node.type === 'job')).toHaveLength(2)
    expect(result.graph.nodes.filter((node) => node.type === 'step')).toHaveLength(3)
    expect(issues.some((issue) => issue.severity === 'error')).toBe(false)
    expect(compiled.workflow.name).toBe('Release Pipeline')
    expect(compiled.workflow.env).toEqual({ LOG_LEVEL: 'debug' })
    expect(compiled.workflow.jobs.build.env).toEqual({ NODE_ENV: 'production' })
    expect(compiled.workflow.jobs.build.strategy).toEqual({
      matrix: {
        node: ['18', '20'],
        os: ['ubuntu-latest', 'windows-latest'],
      },
      'fail-fast': false,
    })
    expect(compiled.workflow.jobs.test.steps[0].env).toEqual({ CI: 'true' })
    expect(compiled.workflow.jobs.build.steps).toHaveLength(2)
    expect(compiled.workflow.jobs.test.needs).toEqual(['build'])
    expect(compiled.yaml).toContain('workflow_dispatch:')
    expect(compiled.yaml).toContain('branches:')
  })
})
