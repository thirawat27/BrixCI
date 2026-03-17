import { createEdge, createJobNode, createStepNode, createTriggerNode } from '../graph/factories'
import { resolveGraphOverlaps } from '../graph/layout'
import type { GraphState } from '../graph/types'

export function createDefaultGraph(): GraphState {
  const trigger = createTriggerNode({
    id: 'trigger-main',
    position: { x: 60, y: 140 },
  })

  const job = createJobNode(
    {
      id: 'job-build',
      position: { x: 380, y: 140 },
    },
    {
      label: 'Build & Test',
      jobId: 'build_test',
      runsOn: 'ubuntu-latest',
    },
  )

  const stepCheckout = createStepNode(
    {
      id: 'step-checkout',
      position: { x: 700, y: 80 },
    },
    {
      label: 'Checkout',
      mode: 'uses',
      actionRef: 'actions/checkout@v4',
      jobNodeId: job.id,
    },
  )

  const stepInstall = createStepNode(
    {
      id: 'step-install',
      position: { x: 700, y: 220 },
    },
    {
      label: 'Install Dependencies',
      mode: 'run',
      runCommand: 'npm ci',
      jobNodeId: job.id,
    },
  )

  return resolveGraphOverlaps({
    nodes: [trigger, job, stepCheckout, stepInstall],
    edges: [
      createEdge('edge-trigger-job', trigger.id, job.id),
      createEdge('edge-job-step-checkout', job.id, stepCheckout.id),
      createEdge('edge-step-chain', stepCheckout.id, stepInstall.id),
    ],
  })
}
