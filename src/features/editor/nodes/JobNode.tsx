import { Handle, Position, type NodeProps } from '@xyflow/react'
import { BriefcaseBusiness } from 'lucide-react'
import type { JobFlowNode } from '../../../domain/graph'
import { useI18n } from '../../../i18n'
import { formatKeyValueLines, formatListValueLines, parseKeyValueLines, parseListValueLines } from '../../../lib/textMaps'
import { useEditorStore } from '../../../store/editorStore'

export function JobNode({ id, data, selected }: NodeProps<JobFlowNode>) {
  const updateNodeData = useEditorStore((state) => state.updateNodeData)
  const { text } = useI18n()

  return (
    <div
      className={`grid min-w-[260px] gap-2 rounded-xl border bg-slate-900/90 p-3 shadow-xl ${
        selected ? 'border-amber-400 ring-1 ring-amber-300/50' : 'border-slate-700'
      }`}
    >
      <Handle type="target" position={Position.Left} />
      <div className="inline-flex items-center gap-2 border-b border-dashed border-slate-600 pb-1 text-xs uppercase tracking-wide text-amber-200">
        <BriefcaseBusiness size={14} />
        {text.jobNode}
      </div>

      <label className="grid gap-1 text-[11px] text-slate-300">
        {text.name}
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
        {text.jobId}
        <input
          className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100"
          value={data.jobId}
          onChange={(event) => {
            const value = event.currentTarget.value
            updateNodeData(id, (current) => ({
              ...current,
              jobId: value,
            }))
          }}
        />
      </label>

      <label className="grid gap-1 text-[11px] text-slate-300">
        {text.runsOn}
        <input
          className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100"
          value={data.runsOn}
          onChange={(event) => {
            const value = event.currentTarget.value
            updateNodeData(id, (current) => ({
              ...current,
              runsOn: value,
            }))
          }}
          placeholder="ubuntu-latest"
        />
      </label>

      <label className="grid gap-1 text-[11px] text-slate-300">
        {text.env}
        <textarea
          className="min-h-20 w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100"
          onChange={(event) => {
            const value = parseKeyValueLines(event.currentTarget.value)
            updateNodeData(id, (current) => ({
              ...current,
              env: value,
            }))
          }}
          placeholder="NODE_ENV=production"
          rows={3}
          value={formatKeyValueLines(data.env)}
        />
      </label>

      <label className="grid gap-1 text-[11px] text-slate-300">
        {text.matrix}
        <textarea
          className="min-h-20 w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100"
          onChange={(event) => {
            const value = parseListValueLines(event.currentTarget.value)
            updateNodeData(id, (current) => ({
              ...current,
              strategyMatrix: value,
            }))
          }}
          placeholder={'node=18, 20\nos=ubuntu-latest, windows-latest'}
          rows={3}
          value={formatListValueLines(data.strategyMatrix)}
        />
      </label>

      <label className="inline-flex items-center gap-2 text-[11px] text-slate-300">
        <input
          checked={data.strategyFailFast}
          className="size-4 rounded border border-slate-600 bg-slate-950/80 text-sky-500 accent-sky-500"
          onChange={(event) => {
            const value = event.currentTarget.checked
            updateNodeData(id, (current) => ({
              ...current,
              strategyFailFast: value,
            }))
          }}
          type="checkbox"
        />
        {text.failFast}
      </label>
      <p className="text-[11px] leading-4 text-slate-500">{text.matrixHelp}</p>

      <Handle type="source" position={Position.Right} id="job-output" />
      <Handle type="source" position={Position.Bottom} id="job-step-output" />
    </div>
  )
}
