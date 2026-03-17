import { detectCycle } from './topology'
import type {
  BrixEdge,
  BrixNode,
  GraphState,
  JobFlowNode,
  StepFlowNode,
  TriggerFlowNode,
  ValidationIssue,
} from './types'

const ALLOWED_EDGE_MAP: Record<BrixNode['type'], BrixNode['type'][]> = {
  trigger: ['job'],
  job: ['job', 'step'],
  step: ['step'],
}

export function isNodeConnectionAllowed(
  sourceType: BrixNode['type'],
  targetType: BrixNode['type'],
): boolean {
  return ALLOWED_EDGE_MAP[sourceType].includes(targetType)
}

function isEdgeAllowed(source: BrixNode, target: BrixNode): boolean {
  return isNodeConnectionAllowed(source.type, target.type)
}

function isEdgeDuplicate(
  edge: BrixEdge,
  allEdges: BrixEdge[],
  index: number,
): boolean {
  return allEdges.some(
    (current, currentIndex) =>
      currentIndex < index &&
      current.source === edge.source &&
      current.target === edge.target,
  )
}

function findTriggerReachableJobs(graph: GraphState, nodeMap: Map<string, BrixNode>): Set<string> {
  const reachableJobs = new Set<string>()
  const queue: string[] = []
  const outgoingJobEdges = new Map<string, string[]>()

  for (const edge of graph.edges) {
    const source = nodeMap.get(edge.source)
    const target = nodeMap.get(edge.target)
    if (source?.type === 'trigger' && target?.type === 'job') {
      if (!reachableJobs.has(target.id)) {
        reachableJobs.add(target.id)
        queue.push(target.id)
      }
      continue
    }

    if (source?.type === 'job' && target?.type === 'job') {
      const existingTargets = outgoingJobEdges.get(source.id) ?? []
      outgoingJobEdges.set(source.id, [...existingTargets, target.id])
    }
  }

  while (queue.length > 0) {
    const currentJobId = queue.shift()
    if (!currentJobId) {
      continue
    }

    for (const targetJobId of outgoingJobEdges.get(currentJobId) ?? []) {
      if (reachableJobs.has(targetJobId)) {
        continue
      }
      reachableJobs.add(targetJobId)
      queue.push(targetJobId)
    }
  }

  return reachableJobs
}

export function validateGraph(graph: GraphState): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const nodeMap = new Map(graph.nodes.map((node) => [node.id, node]))

  const triggers = graph.nodes.filter(
    (node): node is TriggerFlowNode => node.type === 'trigger',
  )
  const jobs = graph.nodes.filter((node): node is JobFlowNode => node.type === 'job')
  const steps = graph.nodes.filter((node): node is StepFlowNode => node.type === 'step')
  const triggerReachableJobs = findTriggerReachableJobs(graph, nodeMap)

  if (triggers.length === 0) {
    issues.push({
      code: 'NO_TRIGGER',
      severity: 'error',
      message: 'Pipeline must include at least one Trigger node.',
    })
  }

  if (jobs.length === 0) {
    issues.push({
      code: 'NO_JOB',
      severity: 'error',
      message: 'Pipeline must include at least one Job node.',
    })
  }

  const jobIdMap = new Map<string, string>()
  for (const job of jobs) {
    const key = job.data.jobId.trim()
    if (!key) {
      issues.push({
        code: 'DUPLICATE_JOB_ID',
        severity: 'error',
        nodeId: job.id,
        message: `Job "${job.data.label}" must define a jobId.`,
      })
      continue
    }

    if (jobIdMap.has(key)) {
      issues.push({
        code: 'DUPLICATE_JOB_ID',
        severity: 'error',
        nodeId: job.id,
        message: `jobId "${key}" is duplicated.`,
      })
    } else {
      jobIdMap.set(key, job.id)
    }
  }

  for (const [index, edge] of graph.edges.entries()) {
    const source = nodeMap.get(edge.source)
    const target = nodeMap.get(edge.target)

    if (!source || !target) {
      issues.push({
        code: 'MISSING_NODE',
        severity: 'error',
        edgeId: edge.id,
        message: `Edge ${edge.id} references a missing node.`,
      })
      continue
    }

    if (!isEdgeAllowed(source, target)) {
      issues.push({
        code: 'INVALID_EDGE',
        severity: 'error',
        edgeId: edge.id,
        message: `Invalid connection: ${source.type} -> ${target.type}.`,
      })
      continue
    }

    if (isEdgeDuplicate(edge, graph.edges, index)) {
      issues.push({
        code: 'INVALID_EDGE',
        severity: 'warning',
        edgeId: edge.id,
        message: `Duplicate connection: ${source.type} -> ${target.type}.`,
      })
    }

    if (
      source.type === 'job' &&
      target.type === 'step' &&
      target.data.jobNodeId &&
      target.data.jobNodeId !== source.id
    ) {
      issues.push({
        code: 'STEP_CHAIN_CROSS_JOB',
        severity: 'error',
        edgeId: edge.id,
        nodeId: target.id,
        message: `Step "${target.data.label}" belongs to a different Job than the incoming edge.`,
      })
    }

    if (source.type === 'step' && target.type === 'step') {
      if (!source.data.jobNodeId || !target.data.jobNodeId) {
        issues.push({
          code: 'STEP_JOB_NOT_FOUND',
          severity: 'error',
          edgeId: edge.id,
          message: 'Connected Steps must be assigned to a Job first.',
        })
      } else if (source.data.jobNodeId !== target.data.jobNodeId) {
        issues.push({
          code: 'STEP_CHAIN_CROSS_JOB',
          severity: 'error',
          edgeId: edge.id,
          message: 'Cross-Job Step chaining is not allowed.',
        })
      }
    }
  }

  for (const step of steps) {
    if (!step.data.jobNodeId) {
      issues.push({
        code: 'STEP_JOB_NOT_FOUND',
        severity: 'warning',
        nodeId: step.id,
        message: `Step "${step.data.label}" is not assigned to a Job (will be skipped on compile).`,
      })
      continue
    }

    const parentJob = nodeMap.get(step.data.jobNodeId)
    if (!parentJob || parentJob.type !== 'job') {
      issues.push({
        code: 'STEP_JOB_NOT_FOUND',
        severity: 'warning',
        nodeId: step.id,
        message: `Step "${step.data.label}" references a Job that no longer exists (will be skipped on compile).`,
      })
    }
  }

  for (const job of jobs) {
    if (!triggerReachableJobs.has(job.id)) {
      issues.push({
        code: 'ORPHAN_JOB',
        severity: 'warning',
        nodeId: job.id,
        message: `Job "${job.data.label}" is not connected from any Trigger.`,
      })
    }

    const hasStep = steps.some((step) => step.data.jobNodeId === job.id)
    if (!hasStep) {
      issues.push({
        code: 'JOB_WITHOUT_STEPS',
        severity: 'warning',
        nodeId: job.id,
        message: `Job "${job.data.label}" has no Steps.`,
      })
    }
  }

  const edgesForCycleCheck = graph.edges.filter((edge) => {
    const source = nodeMap.get(edge.source)
    const target = nodeMap.get(edge.target)
    return source && target && isEdgeAllowed(source, target)
  })

  const cycle = detectCycle(graph.nodes, edgesForCycleCheck)
  if (cycle) {
    issues.push({
      code: 'CYCLE_DETECTED',
      severity: 'error',
      message: `Cycle detected in DAG: ${cycle.join(' -> ')}.`,
    })
  }

  return issues
}

export function hasBlockingIssues(issues: ValidationIssue[]): boolean {
  return issues.some((issue) => issue.severity === 'error')
}
