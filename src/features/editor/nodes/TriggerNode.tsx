import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Play } from 'lucide-react'
import {
  TRIGGER_EVENTS,
  type TriggerEvent,
  type TriggerFlowNode,
} from '../../../domain/graph'
import { useI18n } from '../../../i18n'
import { useEditorStore } from '../../../store/editorStore'

function parseList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

function formatList(arr: string[]): string {
  return arr.join(', ')
}

const EVENT_LABELS: Record<string, string> = {
  push: 'Push',
  pull_request: 'Pull Request',
  pull_request_target: 'PR Target',
  workflow_dispatch: 'Manual (Dispatch)',
  workflow_run: 'Workflow Run',
  workflow_call: 'Workflow Call',
  schedule: 'Schedule (Cron)',
  release: 'Release',
  create: 'Create (branch/tag)',
  delete: 'Delete (branch/tag)',
  deployment: 'Deployment',
  deployment_status: 'Deployment Status',
  issues: 'Issues',
  issue_comment: 'Issue Comment',
  label: 'Label',
  milestone: 'Milestone',
  page_build: 'Page Build',
  public: 'Public',
  registry_package: 'Registry Package',
  repository_dispatch: 'Repository Dispatch',
  status: 'Status',
  watch: 'Watch (Star)',
}

const RELEASE_TYPES = ['published', 'unpublished', 'created', 'edited', 'deleted', 'prereleased', 'released']
const PR_TYPES = ['assigned', 'unassigned', 'labeled', 'unlabeled', 'opened', 'edited', 'closed', 'reopened', 'synchronize', 'converted_to_draft', 'ready_for_review', 'locked', 'unlocked', 'review_requested', 'review_request_removed', 'auto_merge_enabled', 'auto_merge_disabled']

const hasBranchFilter = (e: TriggerEvent) => ['push', 'pull_request', 'pull_request_target'].includes(e)
const hasPathFilter = (e: TriggerEvent) => ['push', 'pull_request', 'pull_request_target'].includes(e)
const hasTagFilter = (e: TriggerEvent) => e === 'push'
const hasTypeFilter = (e: TriggerEvent) => ['release', 'pull_request', 'pull_request_target'].includes(e)
const hasWorkflowsFilter = (e: TriggerEvent) => e === 'workflow_run'
const hasCron = (e: TriggerEvent) => e === 'schedule'

function FieldInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="grid gap-1 text-[10px] uppercase font-semibold text-slate-400 mt-1.5">
      {label}
      <input
        className="w-full rounded border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-[11px] font-normal text-slate-100 normal-case mb-1.5"
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        placeholder={placeholder}
      />
    </label>
  )
}

function ListInput({ label, value, onChange, placeholder }: { label: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  return (
    <FieldInput
      label={label}
      value={formatList(value)}
      onChange={(v) => onChange(parseList(v))}
      placeholder={placeholder}
    />
  )
}

export function TriggerNode({ id, data, selected }: NodeProps<TriggerFlowNode>) {
  const updateNodeData = useEditorStore((state) => state.updateNodeData)
  const { text } = useI18n()

  const update = <K extends keyof typeof data>(key: K, value: typeof data[K]) => {
    updateNodeData(id, (current) => ({ ...current, [key]: value }))
  }

  return (
    <div
      className={`grid min-w-[280px] max-w-[340px] gap-2 rounded-xl border bg-slate-900/95 p-3.5 shadow-xl backdrop-blur-md ${
        selected ? 'border-sky-400 ring-1 ring-sky-400/50' : 'border-slate-700'
      }`}
    >
      <div className="flex items-center gap-2 border-b border-dashed border-slate-600 pb-2 text-[11px] font-bold uppercase tracking-widest text-sky-300">
        <Play size={14} className="opacity-80" />
        {text.triggerNode}
      </div>

      <FieldInput
        label={text.label}
        value={data.label}
        onChange={(v) => update('label', v)}
      />

      <label className="grid gap-1 text-[10px] uppercase font-semibold text-slate-400 mt-1.5">
        {text.event}
        <select
          className="w-full rounded border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-[11px] font-normal text-slate-100 normal-case mb-1.5"
          value={data.event}
          onChange={(e) => update('event', e.currentTarget.value as TriggerEvent)}
        >
          {TRIGGER_EVENTS.map((eventType) => (
            <option key={eventType} value={eventType}>
              {EVENT_LABELS[eventType] ?? eventType}
            </option>
          ))}
        </select>
      </label>

      {hasBranchFilter(data.event) && (
        <>
          <ListInput label={text.branches} value={data.branches} onChange={(v) => update('branches', v)} placeholder="main, develop" />
          <ListInput label={text.branchesIgnore} value={data.branchesIgnore ?? []} onChange={(v) => update('branchesIgnore', v)} placeholder="dependabot/**" />
        </>
      )}

      {hasTagFilter(data.event) && (
        <>
          <ListInput label={text.tags} value={data.tags ?? []} onChange={(v) => update('tags', v)} placeholder="v*" />
          <ListInput label={text.tagsIgnore} value={data.tagsIgnore ?? []} onChange={(v) => update('tagsIgnore', v)} placeholder="v*-beta" />
        </>
      )}

      {hasPathFilter(data.event) && (
        <>
          <ListInput label={text.paths} value={data.paths ?? []} onChange={(v) => update('paths', v)} placeholder="src/**, docs/**" />
          <ListInput label={text.pathsIgnore} value={data.pathsIgnore ?? []} onChange={(v) => update('pathsIgnore', v)} placeholder="**.md" />
        </>
      )}

      {hasTypeFilter(data.event) && (
        <label className="grid gap-1.5 text-[10px] uppercase font-semibold text-slate-400 mt-1">
          {text.types}
          <div className="flex flex-wrap gap-2.5 rounded border border-slate-700/50 bg-slate-950/40 p-2">
            {(data.event === 'release' ? RELEASE_TYPES : PR_TYPES).map((t) => (
              <label key={t} className="flex items-center gap-1 text-[10px] text-slate-300 cursor-pointer normal-case bg-slate-800/40 px-1.5 py-0.5 rounded border border-slate-700/50 hover:bg-slate-700/50 transition-colors">
                <input
                  type="checkbox"
                  checked={(data.types ?? []).includes(t)}
                  onChange={(e) => {
                    const current = data.types ?? []
                    update('types', e.currentTarget.checked ? [...current, t] : current.filter((x) => x !== t))
                  }}
                  className="size-2.5 accent-sky-400"
                />
                {t}
              </label>
            ))}
          </div>
        </label>
      )}

      {hasWorkflowsFilter(data.event) && (
        <ListInput label={text.workflows} value={data.workflows ?? []} onChange={(v) => update('workflows', v)} placeholder="CI, Deploy" />
      )}

      {hasCron(data.event) && (
        <FieldInput
          label={`${text.cron} (cron expression)`}
          value={data.cron}
          onChange={(v) => update('cron', v)}
          placeholder="0 0 * * *"
        />
      )}

      <Handle type="source" position={Position.Right} />
    </div>
  )
}
