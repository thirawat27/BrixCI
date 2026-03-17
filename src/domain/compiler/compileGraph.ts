import { dump } from 'js-yaml'
import { topologicalSortByEdges } from '../graph/topology'
import { hasBlockingIssues, validateGraph } from '../graph/validation'
import type {
  BrixEdge,
  BrixNode,
  CompilationResult,
  GitHubActionJob,
  GitHubActionOnMap,
  GitHubActionStep,
  GraphState,
  JobFlowNode,
  JobNodeData,
  StepFlowNode,
  StepNodeData,
  TriggerFlowNode,
  TriggerNodeData,
  ValidationIssue,
} from '../graph/types'

export const DEFAULT_WORKFLOW_NAME = 'BrixCI Pipeline'

export class CompilationError extends Error {
  readonly issues: ValidationIssue[]

  constructor(message: string, issues: ValidationIssue[]) {
    super(message)
    this.issues = issues
  }
}

function toNodeMap(nodes: BrixNode[]): Map<string, BrixNode> {
  return new Map(nodes.map((node) => [node.id, node]))
}

function sanitizeStringMap(values: Record<string, string>): Record<string, string> | undefined {
  const sanitized = Object.fromEntries(
    Object.entries(values).filter(
      ([key, value]) => key.trim().length > 0 && value.trim().length > 0,
    ),
  )

  return Object.keys(sanitized).length > 0 ? sanitized : undefined
}

function sanitizeMatrix(
  matrix: Record<string, string[]>,
): Record<string, string[]> | undefined {
  const sanitized = Object.fromEntries(
    Object.entries(matrix)
      .map(([key, values]) => [
        key.trim(),
        values.map((item) => item.trim()).filter((item) => item.length > 0),
      ] as const)
      .filter(([key, values]) => key.length > 0 && values.length > 0),
  )

  return Object.keys(sanitized).length > 0 ? sanitized : undefined
}

function normalizeBranchInput(branches: string[]): string[] {
  return Array.from(
    new Set(
      branches
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    ),
  )
}

function mergeEventBranches(
  onMap: GitHubActionOnMap,
  eventName: 'push' | 'pull_request',
  branches: string[],
): void {
  const normalized = normalizeBranchInput(branches)
  if (!(eventName in onMap)) {
    onMap[eventName] = normalized.length > 0 ? { branches: normalized } : {}
    return
  }

  const current = onMap[eventName]
  if (typeof current !== 'object' || current === null) {
    onMap[eventName] = normalized.length > 0 ? { branches: normalized } : {}
    return
  }

  const currentBranches = Array.isArray((current as { branches?: unknown }).branches)
    ? ((current as { branches?: string[] }).branches ?? [])
    : []
  const merged = Array.from(new Set([...currentBranches, ...normalized]))
  onMap[eventName] = merged.length > 0 ? { branches: merged } : {}
}

function buildOnSection(triggerNodes: TriggerFlowNode[]): GitHubActionOnMap {
  const onMap: GitHubActionOnMap = {}
  const scheduleEntries: Array<{ cron: string }> = []

  for (const triggerNode of triggerNodes) {
    const trigger = triggerNode.data as TriggerNodeData
    switch (trigger.event) {
      case 'push':
      case 'pull_request':
        mergeEventBranches(onMap, trigger.event, trigger.branches)
        break
      case 'workflow_dispatch':
        onMap.workflow_dispatch = {}
        break
      case 'schedule': {
        const cron = trigger.cron.trim() || '0 0 * * *'
        scheduleEntries.push({ cron })
        break
      }
      default:
        break
    }
  }

  if (scheduleEntries.length > 0) {
    onMap.schedule = scheduleEntries
  }

  if (Object.keys(onMap).length === 0) {
    onMap.workflow_dispatch = {}
  }

  return onMap
}

function sortJobs(jobNodes: JobFlowNode[], edges: BrixEdge[]): string[] {
  const dependencyEdges = edges
    .filter((edge) => {
      const source = jobNodes.find((node) => node.id === edge.source)
      const target = jobNodes.find((node) => node.id === edge.target)
      return source?.type === 'job' && target?.type === 'job'
    })
    .map((edge) => ({ source: edge.source, target: edge.target }))

  const sortableNodes = jobNodes.map((node) => ({
    id: node.id,
    x: node.position.x,
    y: node.position.y,
  }))

  const sorted = topologicalSortByEdges(sortableNodes, dependencyEdges)
  if (sorted) {
    return sorted
  }

  return [...jobNodes]
    .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x)
    .map((node) => node.id)
}

function sortStepsForJob(
  allNodes: BrixNode[],
  allEdges: BrixEdge[],
  jobNodeId: string,
): StepFlowNode[] {
  const steps = allNodes.filter(
    (node): node is StepFlowNode =>
      node.type === 'step' && (node.data as StepNodeData).jobNodeId === jobNodeId,
  )
  if (steps.length === 0) {
    return []
  }

  const stepMap = new Map(steps.map((step) => [step.id, step]))
  const stepEdges = allEdges
    .filter(
      (edge) =>
        stepMap.has(edge.source) &&
        stepMap.has(edge.target) &&
        stepMap.get(edge.source)!.type === 'step' &&
        stepMap.get(edge.target)!.type === 'step',
    )
    .map((edge) => ({ source: edge.source, target: edge.target }))

  const sortableSteps = steps.map((step) => ({
    id: step.id,
    x: step.position.x,
    y: step.position.y,
  }))

  const sortedIds = topologicalSortByEdges(sortableSteps, stepEdges)
  if (!sortedIds) {
    return [...steps].sort(
      (a, b) => a.position.y - b.position.y || a.position.x - b.position.x,
    )
  }

  return sortedIds.map((id) => stepMap.get(id)!)
}

function toYamlStep(stepData: StepNodeData): GitHubActionStep {
  const env = sanitizeStringMap(stepData.env)

  if (stepData.mode === 'run') {
    const command = stepData.runCommand.trim() || 'echo "No command defined"'
    return {
      name: stepData.label.trim() || undefined,
      run: command,
      env,
    }
  }

  const uses = stepData.actionRef.trim() || 'actions/checkout@v4'
  const withParams = Object.fromEntries(
    Object.entries(stepData.withParams).filter(
      ([key, value]) => key.trim().length > 0 && value.trim().length > 0,
    ),
  )
  const withSection =
    Object.keys(withParams).length > 0 ? (withParams as Record<string, string>) : undefined

  return {
    name: stepData.label.trim() || undefined,
    uses,
    with: withSection,
    env,
  }
}

export function compileGraphToYaml(
  graph: GraphState,
  workflowName = DEFAULT_WORKFLOW_NAME,
  workflowEnv: Record<string, string> = {},
): CompilationResult {
  const issues = validateGraph(graph)
  if (hasBlockingIssues(issues)) {
    throw new CompilationError('Graph validation failed', issues)
  }

  const nodeMap = toNodeMap(graph.nodes)
  const triggerNodes = graph.nodes.filter(
    (node): node is TriggerFlowNode => node.type === 'trigger',
  )
  const jobNodes = graph.nodes.filter((node): node is JobFlowNode => node.type === 'job')
  const sortedJobIds = sortJobs(jobNodes, graph.edges)

  const jobs: Record<string, GitHubActionJob> = {}

  for (const jobNodeId of sortedJobIds) {
    const jobNode = nodeMap.get(jobNodeId)
    if (!jobNode || jobNode.type !== 'job') {
      continue
    }

    const jobData = jobNode.data as JobNodeData
    const yamlJobId = jobData.jobId.trim()
    if (!yamlJobId) {
      continue
    }

    const needs = graph.edges
      .filter((edge) => edge.target === jobNode.id)
      .map((edge) => nodeMap.get(edge.source))
      .filter((node): node is JobFlowNode => node?.type === 'job')
      .map((node) => (node.data as JobNodeData).jobId.trim())
      .filter((item) => item.length > 0)

    const sortedSteps = sortStepsForJob(graph.nodes, graph.edges, jobNode.id)
    const yamlSteps = sortedSteps.map((stepNode) => toYamlStep(stepNode.data as StepNodeData))
    if (yamlSteps.length === 0) {
      yamlSteps.push({
        name: 'Placeholder',
        run: 'echo "Add pipeline steps in BrixCI editor"',
      })
    }

    const env = sanitizeStringMap(jobData.env)
    const matrix = sanitizeMatrix(jobData.strategyMatrix)
    const strategy = matrix
      ? {
          matrix,
          'fail-fast': jobData.strategyFailFast,
        }
      : undefined

    jobs[yamlJobId] = {
      name: jobData.label.trim() || undefined,
      'runs-on': jobData.runsOn.trim() || 'ubuntu-latest',
      needs: needs.length > 0 ? Array.from(new Set(needs)) : undefined,
      env,
      strategy,
      steps: yamlSteps,
    }
  }

  const workflow = {
    name: workflowName.trim() || DEFAULT_WORKFLOW_NAME,
    on: buildOnSection(triggerNodes),
    env: sanitizeStringMap(workflowEnv),
    jobs,
  }

  const yaml = dump(workflow, {
    noRefs: true,
    lineWidth: 120,
    sortKeys: false,
  })

  return { workflow, yaml, issues }
}
