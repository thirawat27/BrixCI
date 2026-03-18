import { z } from 'zod'
import type { GraphState } from './types'

const triggerDataSchema = z.object({
  kind: z.literal('trigger'),
  label: z.string(),
  event: z.enum([
    'push', 'pull_request', 'pull_request_target', 'workflow_dispatch',
    'workflow_run', 'workflow_call', 'schedule', 'release', 'create',
    'delete', 'deployment', 'deployment_status', 'issues', 'issue_comment',
    'label', 'milestone', 'page_build', 'public', 'registry_package',
    'repository_dispatch', 'status', 'watch',
  ]),
  branches: z.array(z.string()),
  branchesIgnore: z.array(z.string()).default([]),
  paths: z.array(z.string()).default([]),
  pathsIgnore: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  tagsIgnore: z.array(z.string()).default([]),
  cron: z.string(),
  workflows: z.array(z.string()).default([]),
  types: z.array(z.string()).default([]),
})

const jobDataSchema = z.object({
  kind: z.literal('job'),
  label: z.string(),
  jobId: z.string(),
  runsOn: z.string(),
  env: z.record(z.string(), z.string()),
  strategyMatrix: z.record(z.string(), z.array(z.string())),
  strategyFailFast: z.boolean(),
  strategyMaxParallel: z.string().default(''),
  timeoutMinutes: z.string().default(''),
  continueOnError: z.boolean().default(false),
  concurrencyGroup: z.string().default(''),
  concurrencyCancelInProgress: z.boolean().default(false),
  permissions: z.record(z.string(), z.string()).default({}),
  outputs: z.record(z.string(), z.string()).default({}),
  defaults: z.string().default(''),
  container: z.string().default(''),
  services: z.string().default(''),
  environment: z.string().default(''),
  environmentUrl: z.string().default(''),
})

const stepDataSchema = z.object({
  kind: z.literal('step'),
  label: z.string(),
  mode: z.enum(['run', 'uses']),
  runCommand: z.string(),
  actionRef: z.string(),
  withParams: z.record(z.string(), z.string()),
  env: z.record(z.string(), z.string()),
  jobNodeId: z.string(),
  stepId: z.string().default(''),
  ifCondition: z.string().default(''),
  timeoutMinutes: z.string().default(''),
  continueOnError: z.boolean().default(false),
  workingDirectory: z.string().default(''),
  shell: z.string().default(''),
})

const nodeSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(['trigger', 'job', 'step']),
    position: z.object({
      x: z.number(),
      y: z.number(),
    }),
    data: z.discriminatedUnion('kind', [triggerDataSchema, jobDataSchema, stepDataSchema]),
  })
  .superRefine((node, ctx) => {
    if (node.type !== node.data.kind) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Node type and data.kind must match.',
      })
    }
  })

const edgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  type: z.string().optional(),
  animated: z.boolean().optional(),
})

export const graphStateSchema = z.object({
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema),
})

export const graphDraftSchema = z.object({
  graph: graphStateSchema,
  yamlOutput: z.string().optional(),
  workflowName: z.string().optional(),
  workflowEnv: z.record(z.string(), z.string()).optional(),
})

export function parseGraphState(input: unknown): GraphState {
  return graphStateSchema.parse(input) as GraphState
}

export function parseGraphDraft(input: unknown): {
  graph: GraphState
  yamlOutput?: string
  workflowName?: string
  workflowEnv?: Record<string, string>
} {
  const parsed = graphDraftSchema.parse(input)
  return {
    graph: parsed.graph as GraphState,
    yamlOutput: parsed.yamlOutput,
    workflowName: parsed.workflowName,
    workflowEnv: parsed.workflowEnv,
  }
}
