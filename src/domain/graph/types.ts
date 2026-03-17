import type { Edge, Node, XYPosition } from '@xyflow/react'

export const NODE_KINDS = ['trigger', 'job', 'step'] as const
export type NodeKind = (typeof NODE_KINDS)[number]

export const TRIGGER_EVENTS = [
  'push',
  'pull_request',
  'workflow_dispatch',
  'schedule',
] as const
export type TriggerEvent = (typeof TRIGGER_EVENTS)[number]

export const STEP_MODES = ['run', 'uses'] as const
export type StepMode = (typeof STEP_MODES)[number]

export interface TriggerNodeData extends Record<string, unknown> {
  kind: 'trigger'
  label: string
  event: TriggerEvent
  branches: string[]
  cron: string
}

export interface JobNodeData extends Record<string, unknown> {
  kind: 'job'
  label: string
  jobId: string
  runsOn: string
  env: Record<string, string>
  strategyMatrix: Record<string, string[]>
  strategyFailFast: boolean
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
  name?: string
  run?: string
  uses?: string
  with?: Record<string, string>
  env?: Record<string, string>
}

export interface GitHubActionStrategy {
  'fail-fast'?: boolean
  matrix?: Record<string, string[]>
}

export interface GitHubActionJob {
  name?: string
  'runs-on': string
  needs?: string[]
  env?: Record<string, string>
  strategy?: GitHubActionStrategy
  steps: GitHubActionStep[]
}

export type GitHubActionOnMap = Record<string, unknown>

export interface GitHubActionWorkflow {
  name: string
  on: GitHubActionOnMap
  env?: Record<string, string>
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
