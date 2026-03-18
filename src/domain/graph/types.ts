import type { Edge, Node, XYPosition } from '@xyflow/react'

export const NODE_KINDS = ['trigger', 'job', 'step'] as const
export type NodeKind = (typeof NODE_KINDS)[number]

export const TRIGGER_EVENTS = [
  'push',
  'pull_request',
  'pull_request_target',
  'workflow_dispatch',
  'workflow_run',
  'workflow_call',
  'schedule',
  'release',
  'create',
  'delete',
  'deployment',
  'deployment_status',
  'issues',
  'issue_comment',
  'label',
  'milestone',
  'page_build',
  'public',
  'registry_package',
  'repository_dispatch',
  'status',
  'watch',
] as const
export type TriggerEvent = (typeof TRIGGER_EVENTS)[number]

export const STEP_MODES = ['run', 'uses'] as const
export type StepMode = (typeof STEP_MODES)[number]

export const RUNNER_LABELS = [
  'ubuntu-latest',
  'ubuntu-22.04',
  'ubuntu-20.04',
  'ubuntu-24.04',
  'windows-latest',
  'windows-2022',
  'windows-2019',
  'macos-latest',
  'macos-14',
  'macos-13',
  'macos-12',
  'self-hosted',
] as const

export interface TriggerNodeData extends Record<string, unknown> {
  kind: 'trigger'
  label: string
  event: TriggerEvent
  branches: string[]
  branchesIgnore: string[]
  paths: string[]
  pathsIgnore: string[]
  tags: string[]
  tagsIgnore: string[]
  cron: string
  // workflow_run / workflow_call specific
  workflows: string[]
  types: string[]
}

export interface JobNodeData extends Record<string, unknown> {
  kind: 'job'
  label: string
  jobId: string
  runsOn: string
  env: Record<string, string>
  strategyMatrix: Record<string, string[]>
  strategyFailFast: boolean
  strategyMaxParallel: string
  // New fields
  timeoutMinutes: string
  continueOnError: boolean
  concurrencyGroup: string
  concurrencyCancelInProgress: boolean
  permissions: Record<string, string>
  outputs: Record<string, string>
  defaults: string
  container: string
  services: string
  environment: string
  environmentUrl: string
}

export interface StepNodeData extends Record<string, unknown> {
  kind: 'step'
  label: string
  mode: StepMode
  runCommand: string
  actionRef: string
  withParams: Record<string, string>
  env: Record<string, string>
  jobNodeId: string
  // New fields
  stepId: string
  ifCondition: string
  timeoutMinutes: string
  continueOnError: boolean
  workingDirectory: string
  shell: string
}

export type EditorNodeData = TriggerNodeData | JobNodeData | StepNodeData

export type TriggerFlowNode = Node<TriggerNodeData, 'trigger'>
export type JobFlowNode = Node<JobNodeData, 'job'>
export type StepFlowNode = Node<StepNodeData, 'step'>
export type BrixNode = Node<EditorNodeData, NodeKind>

export type BrixEdge = Edge<Record<string, unknown>>

export interface GraphState {
  nodes: BrixNode[]
  edges: BrixEdge[]
}

export type ValidationSeverity = 'error' | 'warning'

export type ValidationIssueCode =
  | 'MISSING_NODE'
  | 'INVALID_EDGE'
  | 'CYCLE_DETECTED'
  | 'NO_TRIGGER'
  | 'NO_JOB'
  | 'DUPLICATE_JOB_ID'
  | 'ORPHAN_JOB'
  | 'JOB_WITHOUT_STEPS'
  | 'STEP_JOB_NOT_FOUND'
  | 'STEP_CHAIN_CROSS_JOB'

export interface ValidationIssue {
  code: ValidationIssueCode
  severity: ValidationSeverity
  message: string
  nodeId?: string
  edgeId?: string
}

export interface GitHubActionStep {
  id?: string
  name?: string
  if?: string
  run?: string
  uses?: string
  with?: Record<string, string>
  env?: Record<string, string>
  'timeout-minutes'?: number
  'continue-on-error'?: boolean
  'working-directory'?: string
  shell?: string
}

export interface GitHubActionStrategy {
  'fail-fast'?: boolean
  'max-parallel'?: number
  matrix?: Record<string, string[]>
}

export interface GitHubActionConcurrency {
  group: string
  'cancel-in-progress'?: boolean
}

export interface GitHubActionJob {
  name?: string
  'runs-on': string
  needs?: string[]
  if?: string
  env?: Record<string, string>
  strategy?: GitHubActionStrategy
  steps: GitHubActionStep[]
  'timeout-minutes'?: number
  'continue-on-error'?: boolean
  concurrency?: GitHubActionConcurrency
  permissions?: Record<string, string>
  outputs?: Record<string, string>
  defaults?: unknown
  container?: string
  services?: unknown
  environment?: unknown
}

export type GitHubActionOnMap = Record<string, unknown>

export interface GitHubActionWorkflow {
  name: string
  on: GitHubActionOnMap
  env?: Record<string, string>
  concurrency?: GitHubActionConcurrency
  permissions?: Record<string, string>
  defaults?: unknown
  jobs: Record<string, GitHubActionJob>
}

export interface CompilationResult {
  workflow: GitHubActionWorkflow
  yaml: string
  issues: ValidationIssue[]
}

export interface CreateNodeParams {
  id: string
  position: XYPosition
}
