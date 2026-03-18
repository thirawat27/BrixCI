import type {
  BrixEdge,
  BrixNode,
  GraphState,
  CreateNodeParams,
  JobNodeData,
  StepNodeData,
  TriggerNodeData,
} from './types'
import { nextNodePosition as nextLayoutNodePosition } from './layout'

export const DEFAULT_TRIGGER_DATA: TriggerNodeData = {
  kind: 'trigger',
  label: 'Code Push',
  event: 'push',
  branches: ['main'],
  branchesIgnore: [],
  paths: [],
  pathsIgnore: [],
  tags: [],
  tagsIgnore: [],
  cron: '0 0 * * *',
  workflows: [],
  types: [],
}

export const DEFAULT_JOB_DATA: JobNodeData = {
  kind: 'job',
  label: 'Build',
  jobId: 'build',
  runsOn: 'ubuntu-latest',
  env: {},
  strategyMatrix: {},
  strategyFailFast: true,
  strategyMaxParallel: '',
  timeoutMinutes: '',
  continueOnError: false,
  concurrencyGroup: '',
  concurrencyCancelInProgress: false,
  permissions: {},
  outputs: {},
  defaults: '',
  container: '',
  services: '',
  environment: '',
  environmentUrl: '',
}

export const DEFAULT_STEP_DATA: StepNodeData = {
  kind: 'step',
  label: 'Checkout',
  mode: 'uses',
  runCommand: 'echo "hello from BrixCI"',
  actionRef: 'actions/checkout@v4',
  withParams: {},
  env: {},
  jobNodeId: '',
  stepId: '',
  ifCondition: '',
  timeoutMinutes: '',
  continueOnError: false,
  workingDirectory: '',
  shell: '',
}

export function createTriggerNode(
  params: CreateNodeParams,
  overrides?: Partial<TriggerNodeData>,
): BrixNode {
  return {
    id: params.id,
    type: 'trigger',
    position: params.position,
    data: {
      ...structuredClone(DEFAULT_TRIGGER_DATA),
      ...overrides,
    },
  }
}

export function createJobNode(
  params: CreateNodeParams,
  overrides?: Partial<JobNodeData>,
): BrixNode {
  return {
    id: params.id,
    type: 'job',
    position: params.position,
    data: {
      ...structuredClone(DEFAULT_JOB_DATA),
      ...overrides,
    },
  }
}

export function createStepNode(
  params: CreateNodeParams,
  overrides?: Partial<StepNodeData>,
): BrixNode {
  return {
    id: params.id,
    type: 'step',
    position: params.position,
    data: {
      ...structuredClone(DEFAULT_STEP_DATA),
      ...overrides,
      withParams: {
        ...DEFAULT_STEP_DATA.withParams,
        ...(overrides?.withParams ?? {}),
      },
    },
  }
}

export function createEdge(
  id: string,
  source: string,
  target: string,
  type: BrixEdge['type'] = 'smoothstep',
): BrixEdge {
  return {
    id,
    source,
    target,
    type,
    animated: false,
  }
}

export function nextNodePosition(graph: GraphState, kind: BrixNode['type']) {
  return nextLayoutNodePosition(graph.nodes, kind)
}
