import { describe, expect, it } from 'vitest'
import { createEdge, createJobNode, createStepNode, createTriggerNode } from './factories'
import { validateGraph } from './validation'

describe('graph validation', () => {
  it('flags cycle in graph', () => {
    const jobA = createJobNode({ id: 'job-a', position: { x: 0, y: 0 } }, { jobId: 'job_a' })
    const jobB = createJobNode({ id: 'job-b', position: { x: 1, y: 0 } }, { jobId: 'job_b' })
    const trigger = createTriggerNode({ id: 'trigger', position: { x: 0, y: 0 } })

    const issues = validateGraph({
      nodes: [trigger, jobA, jobB],
      edges: [
        createEdge('t-a', trigger.id, jobA.id),
        createEdge('a-b', jobA.id, jobB.id),
        createEdge('b-a', jobB.id, jobA.id),
      ],
    })

    expect(issues.some((issue) => issue.code === 'CYCLE_DETECTED')).toBe(true)
  })

  it('flags invalid trigger-step connection', () => {
    const trigger = createTriggerNode({ id: 'trigger', position: { x: 0, y: 0 } })
    const step = createStepNode({ id: 'step-1', position: { x: 1, y: 0 } })

    const issues = validateGraph({
      nodes: [trigger, step],
      edges: [createEdge('bad', trigger.id, step.id)],
    })

    expect(issues.some((issue) => issue.code === 'INVALID_EDGE')).toBe(true)
  })

  it('does not flag downstream job as orphan when reachable from a trigger', () => {
    const trigger = createTriggerNode({ id: 'trigger', position: { x: 0, y: 0 } })
    const buildJob = createJobNode(
      { id: 'job-build', position: { x: 1, y: 0 } },
      { jobId: 'build' },
    )
    const testJob = createJobNode(
      { id: 'job-test', position: { x: 2, y: 0 } },
      { jobId: 'test' },
    )

    const issues = validateGraph({
      nodes: [trigger, buildJob, testJob],
      edges: [
        createEdge('trigger-build', trigger.id, buildJob.id),
        createEdge('build-test', buildJob.id, testJob.id),
      ],
    })

    expect(
      issues.some((issue) => issue.code === 'ORPHAN_JOB' && issue.nodeId === testJob.id),
    ).toBe(false)
  })
})
