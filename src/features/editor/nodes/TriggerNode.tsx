import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Play } from 'lucide-react'
import {
  TRIGGER_EVENTS,
  type TriggerEvent,
  type TriggerFlowNode,
} from '../../../domain/graph'
import { useI18n } from '../../../i18n'
import { useEditorStore } from '../../../store/editorStore'

function parseBranches(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

export function TriggerNode({ id, data, selected }: NodeProps<TriggerFlowNode>) {
  const updateNodeData = useEditorStore((state) => state.updateNodeData)
  const { text } = useI18n()

  return (
    <div
      className={`grid min-w-[260px] gap-2 rounded-xl border bg-slate-900/90 p-3 shadow-xl ${
        selected ? 'border-sky-400 ring-1 ring-sky-400/50' : 'border-slate-700'
      }`}
    >
      <div className="inline-flex items-center gap-2 border-b border-dashed border-slate-600 pb-1 text-xs uppercase tracking-wide text-sky-300">
        <Play size={14} />
        {text.triggerNode}
      </div>
      <label className="grid gap-1 text-[11px] text-slate-300">
        {text.label}
        <input
          className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100"
          value={data.label}
          onChange={(event) => {
            const value = event.currentTarget.value
            updateNodeData(id, (current) => ({
              ...current,
              label: value,
            }))
          }}
        />
      </label>

      <label className="grid gap-1 text-[11px] text-slate-300">
        {text.event}
        <select
          className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100"
          value={data.event}
          onChange={(event) => {
            const value = event.currentTarget.value as TriggerEvent
            updateNodeData(id, (current) => ({
              ...current,
              event: value,
            }))
          }}
        >
          {TRIGGER_EVENTS.map((eventType) => (
            <option key={eventType} value={eventType}>
              {eventType}
            </option>
          ))}
        </select>
      </label>

      {(data.event === 'push' || data.event === 'pull_request') && (
        <label className="grid gap-1 text-[11px] text-slate-300">
          {text.branches}
          <input
            className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100"
            value={data.branches.join(', ')}
            onChange={(event) => {
              const branches = parseBranches(event.currentTarget.value)
              updateNodeData(id, (current) => ({
                ...current,
                branches,
              }))
            }}
          />
        </label>
      )}

      {data.event === 'schedule' && (
        <label className="grid gap-1 text-[11px] text-slate-300">
          {text.cron}
          <input
            className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100"
            value={data.cron}
            onChange={(event) => {
              const value = event.currentTarget.value
              updateNodeData(id, (current) => ({
                ...current,
                cron: value,
              }))
            }}
            placeholder="0 0 * * *"
          />
        </label>
      )}

      <Handle type="source" position={Position.Right} />
    </div>
  )
}
