import { Handle, Position, type NodeProps } from '@xyflow/react'
import { ListChecks } from 'lucide-react'
import { STEP_MODES, type StepFlowNode, type StepMode } from '../../../domain/graph'
import { useI18n } from '../../../i18n'
import { formatKeyValueLines, parseKeyValueLines } from '../../../lib/textMaps'
import { useEditorStore } from '../../../store/editorStore'

export function StepNode({ id, data, selected }: NodeProps<StepFlowNode>) {
  const updateNodeData = useEditorStore((state) => state.updateNodeData)
  const { text } = useI18n()

  return (
    <div
      className={`grid min-w-[260px] gap-2 rounded-xl border bg-slate-900/90 p-3 shadow-xl ${
        selected ? 'border-emerald-400 ring-1 ring-emerald-300/50' : 'border-slate-700'
      }`}
    >
      <Handle type="target" position={Position.Left} />
      <div className="inline-flex items-center gap-2 border-b border-dashed border-slate-600 pb-1 text-xs uppercase tracking-wide text-emerald-200">
        <ListChecks size={14} />
        {text.stepNode}
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
        {text.mode}
        <select
          className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100"
          value={data.mode}
          onChange={(event) => {
            const value = event.currentTarget.value as StepMode
            updateNodeData(id, (current) => ({
              ...current,
              mode: value,
            }))
          }}
        >
          {STEP_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {mode}
            </option>
          ))}
        </select>
      </label>

      {data.mode === 'run' ? (
        <label className="grid gap-1 text-[11px] text-slate-300">
          {text.command}
          <textarea
            className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100"
            rows={3}
            value={data.runCommand}
            onChange={(event) => {
              const value = event.currentTarget.value
              updateNodeData(id, (current) => ({
                ...current,
                runCommand: value,
              }))
            }}
            placeholder="npm run test"
          />
        </label>
      ) : (
        <>
          <label className="grid gap-1 text-[11px] text-slate-300">
            {text.action}
            <input
              className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100"
              value={data.actionRef}
              onChange={(event) => {
                const value = event.currentTarget.value
                updateNodeData(id, (current) => ({
                  ...current,
                  actionRef: value,
                }))
              }}
              placeholder="actions/checkout@v4"
            />
          </label>
          <label className="grid gap-1 text-[11px] text-slate-300">
            {text.withParams}
            <textarea
              className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100"
              rows={3}
              value={formatKeyValueLines(data.withParams)}
              onChange={(event) => {
                const value = parseKeyValueLines(event.currentTarget.value)
                updateNodeData(id, (current) => ({
                  ...current,
                  withParams: value,
                }))
              }}
            />
          </label>
        </>
      )}

      <label className="grid gap-1 text-[11px] text-slate-300">
        {text.env}
        <textarea
          className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100"
          onChange={(event) => {
            const value = parseKeyValueLines(event.currentTarget.value)
            updateNodeData(id, (current) => ({
              ...current,
              env: value,
            }))
          }}
          placeholder="CI=true"
          rows={3}
          value={formatKeyValueLines(data.env)}
        />
      </label>
      <p className="text-[11px] leading-4 text-slate-500">{text.envHelp}</p>

      <div className="rounded-md border border-dashed border-slate-600 px-2 py-1 text-[11px] text-slate-300">
        {text.jobRef}: {data.jobNodeId || text.unassigned}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
