import { load } from 'js-yaml'
import { createEdge, createJobNode, createStepNode, createTriggerNode } from '../graph/factories'
import { resolveGraphOverlaps } from '../graph/layout'
import type { GraphState, StepMode, TriggerEvent } from '../graph/types'
import { DEFAULT_WORKFLOW_NAME } from './compileGraph'

const TRIGGER_X = 80
const JOB_X = 420
const STEP_X = 800
const TRIGGER_VERTICAL_GAP = 170
const STEP_VERTICAL_GAP = 132
const MIN_JOB_LANE_HEIGHT = 220
const LANE_GAP = 40

type UnknownRecord = Record<string, unknown>

interface TriggerSpec {
  event: TriggerEvent
  label: string
  branches: string[]
  cron: string
}

interface StepSpec {
  label: string
  mode: StepMode
  runCommand: string
  actionRef: string
  withParams: Record<string, string>
  env: Record<string, string>
}

interface JobSpec {
  jobId: string
  label: string
  runsOn: string
  needs: string[]
  env: Record<string, string>
  strategyMatrix: Record<string, string[]>
  strategyFailFast: boolean
  steps: StepSpec[]
}

export interface WorkflowImportResult {
  graph: GraphState
  workflowName: string
  workflowEnv: Record<string, string>
}

export class WorkflowImportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WorkflowImportError'
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringifyYamlValue(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (value === null || typeof value === 'undefined') {
    return ''
  }
  return JSON.stringify(value)
}

function normalizeStringList(value: unknown): string[] {
  if (typeof value === 'string') {
    const normalized = value.trim()
    return normalized ? [normalized] : []
  }

  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter((entry) => entry.length > 0)
}

function parseEnvSection(value: unknown, context: string): Record<string, string> {
  if (typeof value === 'undefined' || value === null) {
    return {}
  }

  if (!isRecord(value)) {
    throw new WorkflowImportError(`${context} env must be an object.`)
  }

  return Object.fromEntries(
    Object.entries(value)
      .map(([key, entry]) => [key.trim(), stringifyYamlValue(entry)] as const)
      .filter(([key, entry]) => key.length > 0 && entry.length > 0),
  )
}

function parseMatrixSection(value: unknown, jobId: string): Record<string, string[]> {
  if (typeof value === 'undefined' || value === null) {
    return {}
  }

  if (!isRecord(value)) {
    throw new WorkflowImportError(`Job "${jobId}" strategy.matrix must be an object.`)
  }

  const matrix: Record<string, string[]> = {}

  for (const [key, entry] of Object.entries(value)) {
    const trimmedKey = key.trim()
    if (!trimmedKey) {
      continue
    }

    if (trimmedKey === 'include' || trimmedKey === 'exclude') {
      throw new WorkflowImportError(
        `Job "${jobId}" uses strategy.${trimmedKey}, which is not supported in the visual editor yet.`,
      )
    }

    if (Array.isArray(entry)) {
      const values = entry
        .map((item) => stringifyYamlValue(item).trim())
        .filter((item) => item.length > 0)
      if (values.length > 0) {
        matrix[trimmedKey] = values
      }
      continue
    }

    const scalarValue = stringifyYamlValue(entry).trim()
    if (scalarValue.length > 0) {
      matrix[trimmedKey] = [scalarValue]
    }
  }

  return matrix
}

function uniqueId(ids: Set<string>, seed: string): string {
  let nextId = seed
  let counter = 2
  while (ids.has(nextId)) {
    nextId = `${seed}-${counter}`
    counter += 1
  }
  ids.add(nextId)
  return nextId
}

function createEventLabel(event: TriggerEvent): string {
  switch (event) {
    case 'push':
      return 'Code Push'
    case 'pull_request':
      return 'Pull Request'
    case 'workflow_dispatch':
      return 'Manual Trigger'
    case 'schedule':
      return 'Scheduled Run'
    default:
      return 'Trigger'
  }
}

function parseScheduleEntries(value: unknown): TriggerSpec[] {
  if (!Array.isArray(value)) {
    return []
  }

  const triggers: TriggerSpec[] = []

  for (const entry of value) {
    if (!isRecord(entry) || typeof entry.cron !== 'string' || entry.cron.trim().length === 0) {
      continue
    }

    triggers.push({
      event: 'schedule',
      label: createEventLabel('schedule'),
      branches: [],
      cron: entry.cron.trim(),
    })
  }

  return triggers
}

function parseTriggerSpecs(rawOn: unknown): TriggerSpec[] {
  if (typeof rawOn === 'string') {
    return parseTriggerSpecs([rawOn])
  }

  if (Array.isArray(rawOn)) {
    return rawOn
      .filter((entry): entry is string => typeof entry === 'string')
      .map((entry) => entry.trim())
      .filter((entry): entry is TriggerEvent =>
        ['push', 'pull_request', 'workflow_dispatch', 'schedule'].includes(entry),
      )
      .map((event) => ({
        event,
        label: createEventLabel(event),
        branches: [],
        cron: '0 0 * * *',
      }))
  }

  if (!isRecord(rawOn)) {
    throw new WorkflowImportError(
      'Workflow "on" section must be a string, array, or object with supported GitHub Actions events.',
    )
  }

  const triggers: TriggerSpec[] = []

  for (const [eventName, config] of Object.entries(rawOn)) {
    if (eventName === 'push' || eventName === 'pull_request') {
      const branches = isRecord(config) ? normalizeStringList(config.branches) : []
      triggers.push({
        event: eventName,
        label: createEventLabel(eventName),
        branches,
        cron: '0 0 * * *',
      })
      continue
    }

    if (eventName === 'workflow_dispatch') {
      triggers.push({
        event: 'workflow_dispatch',
        label: createEventLabel('workflow_dispatch'),
        branches: [],
        cron: '0 0 * * *',
      })
      continue
    }

    if (eventName === 'schedule') {
      triggers.push(...parseScheduleEntries(config))
    }
  }

  if (triggers.length === 0) {
    throw new WorkflowImportError(
      'No supported trigger events found. Supported events: push, pull_request, workflow_dispatch, schedule.',
    )
  }

  return triggers
}

function inferStepLabel(step: UnknownRecord, index: number): string {
  if (typeof step.name === 'string' && step.name.trim().length > 0) {
    return step.name.trim()
  }

  if (typeof step.uses === 'string' && step.uses.trim().length > 0) {
    return step.uses.trim()
  }

  return `Step ${index + 1}`
}

function parseStepSpec(rawStep: unknown, index: number): StepSpec {
  if (!isRecord(rawStep)) {
    throw new WorkflowImportError(`Step ${index + 1} must be an object.`)
  }

  const label = inferStepLabel(rawStep, index)
  const withParams = isRecord(rawStep.with)
    ? Object.fromEntries(
        Object.entries(rawStep.with)
          .map(([key, value]) => [key.trim(), stringifyYamlValue(value)] as const)
          .filter(([key, value]) => key.length > 0 && value.length > 0),
      )
    : {}
  const env = parseEnvSection(rawStep.env, `Step "${label}"`)

  if (typeof rawStep.run === 'string' && rawStep.run.trim().length > 0) {
    return {
      label,
      mode: 'run',
      runCommand: rawStep.run,
      actionRef: '',
      withParams: {},
      env,
    }
  }

  if (typeof rawStep.uses === 'string' && rawStep.uses.trim().length > 0) {
    return {
      label,
      mode: 'uses',
      runCommand: '',
      actionRef: rawStep.uses.trim(),
      withParams,
      env,
    }
  }

  throw new WorkflowImportError(`Step "${label}" must define either "run" or "uses".`)
}

function parseNeeds(value: unknown): string[] {
  return normalizeStringList(value)
}

function parseJobSpec(jobId: string, rawJob: unknown): JobSpec {
  if (!isRecord(rawJob)) {
    throw new WorkflowImportError(`Job "${jobId}" must be an object.`)
  }

  if ('uses' in rawJob) {
    throw new WorkflowImportError(
      `Job "${jobId}" uses reusable workflows, which are not supported in the visual editor yet.`,
    )
  }

  if (typeof rawJob['runs-on'] !== 'string' || rawJob['runs-on'].trim().length === 0) {
    throw new WorkflowImportError(
      `Job "${jobId}" must define "runs-on" as a single runner label string.`,
    )
  }

  const steps = Array.isArray(rawJob.steps)
    ? rawJob.steps.map((step, index) => parseStepSpec(step, index))
    : []
  const strategy = isRecord(rawJob.strategy) ? rawJob.strategy : undefined

  return {
    jobId,
    label:
      typeof rawJob.name === 'string' && rawJob.name.trim().length > 0
        ? rawJob.name.trim()
        : jobId,
    runsOn: rawJob['runs-on'].trim(),
    needs: parseNeeds(rawJob.needs),
    env: parseEnvSection(rawJob.env, `Job "${jobId}"`),
    strategyMatrix: parseMatrixSection(strategy?.matrix, jobId),
    strategyFailFast: typeof strategy?.['fail-fast'] === 'boolean' ? strategy['fail-fast'] : true,
    steps,
  }
}

function parseJobs(rawJobs: unknown): JobSpec[] {
  if (!isRecord(rawJobs)) {
    throw new WorkflowImportError('Workflow "jobs" section must be an object.')
  }

  const jobs = Object.entries(rawJobs).map(([jobId, rawJob]) => parseJobSpec(jobId, rawJob))
  if (jobs.length === 0) {
    throw new WorkflowImportError('Workflow must define at least one job.')
  }

  return jobs
}

export function parseWorkflowYaml(source: string): WorkflowImportResult {
  let parsed: unknown

  try {
    parsed = load(source)
  } catch {
    throw new WorkflowImportError('Invalid YAML syntax.')
  }

  if (!isRecord(parsed)) {
    throw new WorkflowImportError('Workflow YAML must be a top-level object.')
  }

  const workflowName =
    typeof parsed.name === 'string' && parsed.name.trim().length > 0
      ? parsed.name.trim()
      : DEFAULT_WORKFLOW_NAME
  const workflowEnv = parseEnvSection(parsed.env, 'Workflow')
  const triggers = parseTriggerSpecs(parsed.on)
  const jobs = parseJobs(parsed.jobs)

  const nodes = []
  const edges = []
  const ids = new Set<string>()
  const jobNodeIdsByJobId = new Map<string, string>()

  triggers.forEach((trigger, index) => {
    const triggerNodeId = uniqueId(ids, `trigger-${trigger.event}`)
    nodes.push(
      createTriggerNode(
        {
          id: triggerNodeId,
          position: {
            x: TRIGGER_X,
            y: 120 + index * TRIGGER_VERTICAL_GAP,
          },
        },
        {
          label: trigger.label,
          event: trigger.event,
          branches: trigger.branches,
          cron: trigger.cron,
        },
      ),
    )
  })

  let currentJobLaneY = 120
  for (const job of jobs) {
    const stepCount = Math.max(job.steps.length, 1)
    const stepsStartY = currentJobLaneY
    const laneHeight = Math.max(
      MIN_JOB_LANE_HEIGHT,
      stepCount * STEP_VERTICAL_GAP + LANE_GAP,
    )
    const jobNodeId = uniqueId(ids, `job-${job.jobId}`)
    const jobCenterOffset = ((stepCount - 1) * STEP_VERTICAL_GAP) / 2

    nodes.push(
      createJobNode(
        {
          id: jobNodeId,
          position: {
            x: JOB_X,
            y: stepsStartY + jobCenterOffset,
          },
        },
        {
          label: job.label,
          jobId: job.jobId,
          runsOn: job.runsOn,
          env: job.env,
          strategyMatrix: job.strategyMatrix,
          strategyFailFast: job.strategyFailFast,
        },
      ),
    )
    jobNodeIdsByJobId.set(job.jobId, jobNodeId)

    let previousStepNodeId: string | null = null

    job.steps.forEach((step, stepIndex) => {
      const stepNodeId = uniqueId(ids, `step-${job.jobId}-${stepIndex + 1}`)
      nodes.push(
        createStepNode(
          {
            id: stepNodeId,
            position: {
              x: STEP_X,
              y: stepsStartY + stepIndex * STEP_VERTICAL_GAP,
            },
          },
          {
            label: step.label,
            mode: step.mode,
            runCommand: step.runCommand,
            actionRef: step.actionRef,
            withParams: step.withParams,
            env: step.env,
            jobNodeId,
          },
        ),
      )

      if (previousStepNodeId) {
        edges.push(
          createEdge(uniqueId(ids, `edge-${previousStepNodeId}-${stepNodeId}`), previousStepNodeId, stepNodeId),
        )
      } else {
        edges.push(createEdge(uniqueId(ids, `edge-${jobNodeId}-${stepNodeId}`), jobNodeId, stepNodeId))
      }

      previousStepNodeId = stepNodeId
    })

    currentJobLaneY += laneHeight
  }

  for (const job of jobs) {
    const targetJobNodeId = jobNodeIdsByJobId.get(job.jobId)
    if (!targetJobNodeId) {
      continue
    }

    for (const dependency of job.needs) {
      const sourceJobNodeId = jobNodeIdsByJobId.get(dependency)
      if (!sourceJobNodeId) {
        continue
      }

      edges.push(
        createEdge(uniqueId(ids, `edge-${sourceJobNodeId}-${targetJobNodeId}`), sourceJobNodeId, targetJobNodeId),
      )
    }
  }

  const rootJobIds = jobs
    .filter((job) => job.needs.length === 0)
    .map((job) => jobNodeIdsByJobId.get(job.jobId))
    .filter((jobNodeId): jobNodeId is string => !!jobNodeId)
  const triggerTargets = rootJobIds.length > 0 ? rootJobIds : Array.from(jobNodeIdsByJobId.values())

  const triggerNodeIds = nodes
    .filter((node) => node.type === 'trigger')
    .map((node) => node.id)

  for (const triggerNodeId of triggerNodeIds) {
    for (const jobNodeId of triggerTargets) {
      edges.push(createEdge(uniqueId(ids, `edge-${triggerNodeId}-${jobNodeId}`), triggerNodeId, jobNodeId))
    }
  }

  return {
    workflowName,
    workflowEnv,
    graph: resolveGraphOverlaps({
      nodes,
      edges,
    }),
  }
}
