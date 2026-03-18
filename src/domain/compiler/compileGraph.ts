import { dump } from 'js-yaml'
import { topologicalSortByEdges } from '../graph/topology'
import { hasBlockingIssues, validateGraph } from '../graph/validation'
import type {
  BrixEdge,
  BrixNode,
  CompilationResult,
  GitHubActionConcurrency,
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

function buildTriggerConfig(trigger: TriggerNodeData): Record<string, unknown> {
  const config: Record<string, unknown> = {}

  const branches = normalizeBranchInput(trigger.branches ?? [])
  const branchesIgnore = normalizeBranchInput(trigger.branchesIgnore ?? [])
  const paths = normalizeBranchInput(trigger.paths ?? [])
  const pathsIgnore = normalizeBranchInput(trigger.pathsIgnore ?? [])
  const tags = normalizeBranchInput(trigger.tags ?? [])
  const tagsIgnore = normalizeBranchInput(trigger.tagsIgnore ?? [])
  const types = normalizeBranchInput(trigger.types ?? [])

  if (branches.length) config.branches = branches
  if (branchesIgnore.length) config['branches-ignore'] = branchesIgnore
  if (paths.length) config.paths = paths
  if (pathsIgnore.length) config['paths-ignore'] = pathsIgnore
  if (tags.length) config.tags = tags
  if (tagsIgnore.length) config['tags-ignore'] = tagsIgnore
  if (types.length) config.types = types

  return config
}

function buildOnSection(triggerNodes: TriggerFlowNode[]): GitHubActionOnMap {
  const onMap: GitHubActionOnMap = {}
  const scheduleEntries: Array<{ cron: string }> = []

  for (const triggerNode of triggerNodes) {
    const trigger = triggerNode.data as TriggerNodeData

    switch (trigger.event) {
      case 'push':
      case 'pull_request':
      case 'pull_request_target': {
        const config = buildTriggerConfig(trigger)
        if (trigger.event in onMap) {
          // Merge branches
          const existing = onMap[trigger.event] as Record<string, unknown>
          const existBranches = (existing.branches as string[] | undefined) ?? []
          const newBranches = (config.branches as string[] | undefined) ?? []
          config.branches = Array.from(new Set([...existBranches, ...newBranches]))
            .filter(Boolean)
        }
        onMap[trigger.event] = Object.keys(config).length ? config : null
        break
      }
      case 'workflow_dispatch':
        onMap.workflow_dispatch = {}
        break
      case 'workflow_call':
        onMap.workflow_call = {}
        break
      case 'workflow_run': {
        const workflows = normalizeBranchInput(trigger.workflows ?? [])
        const types = normalizeBranchInput(trigger.types ?? [])
        onMap.workflow_run = {
          ...(workflows.length ? { workflows } : {}),
          ...(types.length ? { types } : { types: ['completed'] }),
        }
        break
      }
      case 'schedule': {
        const cron = trigger.cron.trim() || '0 0 * * *'
        scheduleEntries.push({ cron })
        break
      }
      case 'release': {
        const types = normalizeBranchInput(trigger.types ?? [])
        onMap.release = types.length ? { types } : { types: ['published'] }
        break
      }
      default: {
        // Generic event — just mark as enabled
        const config = buildTriggerConfig(trigger)
        onMap[trigger.event] = Object.keys(config).length ? config : null
        break
      }
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
  const timeoutMinutes = stepData.timeoutMinutes?.trim()
  const timeoutNum = timeoutMinutes ? parseInt(timeoutMinutes, 10) : undefined

  const base: GitHubActionStep = {
    ...(stepData.stepId?.trim() ? { id: stepData.stepId.trim() } : {}),
    name: stepData.label.trim() || undefined,
    ...(stepData.ifCondition?.trim() ? { if: stepData.ifCondition.trim() } : {}),
    ...(stepData.workingDirectory?.trim() ? { 'working-directory': stepData.workingDirectory.trim() } : {}),
    ...(stepData.shell?.trim() ? { shell: stepData.shell.trim() } : {}),
    ...(timeoutNum && !isNaN(timeoutNum) ? { 'timeout-minutes': timeoutNum } : {}),
    ...(stepData.continueOnError ? { 'continue-on-error': true } : {}),
    env,
  }

  if (stepData.mode === 'run') {
    return {
      ...base,
      run: stepData.runCommand.trim() || 'echo "No command defined"',
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
    ...base,
    uses,
    with: withSection,
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
    const maxParallelNum = jobData.strategyMaxParallel?.trim()
      ? parseInt(jobData.strategyMaxParallel.trim(), 10)
      : undefined
    const strategy = matrix
      ? {
          matrix,
          'fail-fast': jobData.strategyFailFast,
          ...(maxParallelNum && !isNaN(maxParallelNum) ? { 'max-parallel': maxParallelNum } : {}),
        }
      : undefined

    const timeoutNum = jobData.timeoutMinutes?.trim()
      ? parseInt(jobData.timeoutMinutes.trim(), 10)
      : undefined

    const permissions = sanitizeStringMap(jobData.permissions ?? {})
    const outputs = sanitizeStringMap(jobData.outputs ?? {})

    const concurrency: GitHubActionConcurrency | undefined = jobData.concurrencyGroup?.trim()
      ? {
          group: jobData.concurrencyGroup.trim(),
          'cancel-in-progress': jobData.concurrencyCancelInProgress,
        }
      : undefined

    const environmentConfig = jobData.environment?.trim()
      ? jobData.environmentUrl?.trim()
        ? { name: jobData.environment.trim(), url: jobData.environmentUrl.trim() }
        : jobData.environment.trim()
      : undefined

    const container = jobData.container?.trim() || undefined

    jobs[yamlJobId] = {
      name: jobData.label.trim() || undefined,
      'runs-on': jobData.runsOn.trim() || 'ubuntu-latest',
      needs: needs.length > 0 ? Array.from(new Set(needs)) : undefined,
      ...(environmentConfig ? { environment: environmentConfig } : {}),
      ...(concurrency ? { concurrency } : {}),
      ...(permissions ? { permissions } : {}),
      ...(timeoutNum && !isNaN(timeoutNum) ? { 'timeout-minutes': timeoutNum } : {}),
      ...(jobData.continueOnError ? { 'continue-on-error': true } : {}),
      ...(container ? { container } : {}),
      env,
      strategy,
      ...(outputs ? { outputs } : {}),
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
