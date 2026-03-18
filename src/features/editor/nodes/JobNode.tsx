import { Handle, Position, type NodeProps } from '@xyflow/react'
import { BriefcaseBusiness, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import type { JobFlowNode } from '../../../domain/graph'
import { RUNNER_LABELS } from '../../../domain/graph/types'
import { useI18n } from '../../../i18n'
import { formatKeyValueLines, formatListValueLines, parseKeyValueLines, parseListValueLines } from '../../../lib/textMaps'
import { useEditorStore } from '../../../store/editorStore'

function FieldInput({ label, value, onChange, placeholder, mono }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean
}) {
  return (
    <label className="grid gap-1 text-[10px] uppercase font-semibold text-slate-400 mt-1.5">
      {label}
      <input
        className={`w-full rounded border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-[11px] font-normal text-slate-100 normal-case mb-1.5 ${mono ? 'font-mono' : ''}`}
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        placeholder={placeholder}
      />
    </label>
  )
}

function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="mt-1.5 rounded-lg border border-slate-700/50 overflow-hidden bg-slate-800/20">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {title}
      </button>
      {open && <div className="grid gap-1.5 px-2.5 pb-2.5 pt-1">{children}</div>}
    </div>
  )
}

export function JobNode({ id, data, selected }: NodeProps<JobFlowNode>) {
  const updateNodeData = useEditorStore((state) => state.updateNodeData)
  const { text } = useI18n()

  const update = <K extends keyof typeof data>(key: K, value: typeof data[K]) => {
    updateNodeData(id, (current) => ({ ...current, [key]: value }))
  }

  return (
    <div
      className={`grid min-w-[280px] max-w-[340px] gap-2 rounded-xl border bg-slate-900/95 p-5 shadow-xl backdrop-blur-md ${
        selected ? 'border-amber-400 ring-1 ring-amber-300/50' : 'border-slate-700'
      }`}
    >
      <Handle type="target" position={Position.Left} className="!w-6 !h-6 !bg-slate-800 !border-[3px] !border-white hover:!bg-white transition-colors cursor-crosshair" />
      <div className="flex items-center gap-2 border-b border-dashed border-slate-600 pb-2 text-[11px] font-bold uppercase tracking-widest text-amber-300">
        <BriefcaseBusiness size={14} className="opacity-80" />
        {text.jobNode}
      </div>

      {/* Core fields – always visible */}
      <FieldInput label={text.name} value={data.label} onChange={(v) => update('label', v)} />
      <FieldInput label={text.jobId} value={data.jobId} onChange={(v) => update('jobId', v)} mono />

      <label className="grid gap-1 text-[10px] uppercase font-semibold text-slate-400 mt-1.5">
        {text.runsOn}
        <input
          list={`runners-${id}`}
          className="w-full rounded border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-[11px] font-normal text-slate-100 normal-case mb-1.5 font-mono"
          value={data.runsOn}
          onChange={(e) => update('runsOn', e.currentTarget.value)}
          placeholder="ubuntu-latest"
        />
        <datalist id={`runners-${id}`}>
          {RUNNER_LABELS.map((r) => <option key={r} value={r} />)}
        </datalist>
      </label>

      {/* Strategy */}
      <Section title={text.strategyMatrix}>
        <label className="grid gap-1 text-[10px] uppercase font-semibold text-slate-400 mt-1.5">
          {text.matrix}
          <textarea
            className="w-full rounded border border-slate-700 bg-slate-950/70 px-2 py-2 text-[11px] font-normal text-slate-100 font-mono normal-case mb-1.5 leading-relaxed"
            onChange={(e) => update('strategyMatrix', parseListValueLines(e.currentTarget.value))}
            placeholder={'node=18, 20\nos=ubuntu-latest, windows-latest'}
            rows={2}
            value={formatListValueLines(data.strategyMatrix)}
          />
        </label>
        <FieldInput label={text.maxParallel} value={data.strategyMaxParallel ?? ''} onChange={(v) => update('strategyMaxParallel', v)} placeholder="4" />
        <label className="flex items-center gap-2.5 text-[11px] text-slate-300 py-1.5 cursor-pointer">
          <input
            checked={data.strategyFailFast}
            className="size-4 rounded border border-slate-600 bg-slate-950/80 accent-amber-500"
            onChange={(e) => update('strategyFailFast', e.currentTarget.checked)}
            type="checkbox"
          />
          {text.failFast}
        </label>
      </Section>

      {/* Environment Variables */}
      <Section title={text.environmentVars}>
        <label className="grid gap-1 text-[10px] uppercase font-semibold text-slate-400 mt-1.5">
          {text.env}
          <textarea
            className="w-full rounded border border-slate-700 bg-slate-950/70 px-2 py-2 text-[11px] font-normal text-slate-100 font-mono normal-case leading-relaxed"
            onChange={(e) => update('env', parseKeyValueLines(e.currentTarget.value))}
            placeholder="NODE_ENV=production"
            rows={3}
            value={formatKeyValueLines(data.env)}
          />
        </label>
      </Section>

      {/* Concurrency */}
      <Section title={text.concurrencyGroup?.split(' ')[0] || 'Concurrency'}>
        <FieldInput label={text.concurrencyGroup} value={data.concurrencyGroup ?? ''} onChange={(v) => update('concurrencyGroup', v)} placeholder="${{ github.workflow }}" mono />
        <label className="flex items-center gap-2.5 text-[11px] text-slate-300 py-1.5 cursor-pointer">
          <input
            checked={data.concurrencyCancelInProgress ?? false}
            className="size-4 rounded border border-slate-600 bg-slate-950/80 accent-amber-500"
            onChange={(e) => update('concurrencyCancelInProgress', e.currentTarget.checked)}
            type="checkbox"
          />
          {text.concurrencyCancelInProgress}
        </label>
      </Section>

      {/* Permissions */}
      <Section title={text.permissions}>
        <label className="grid gap-1 text-[10px] uppercase font-semibold text-slate-400 mt-1.5">
          <span className="text-[9px] text-slate-500 lowercase font-normal mb-0.5">{text.permissionsHelp}</span>
          <textarea
            className="w-full rounded border border-slate-700 bg-slate-950/70 px-2 py-2 text-[11px] font-normal text-slate-100 font-mono normal-case leading-relaxed"
            onChange={(e) => update('permissions', parseKeyValueLines(e.currentTarget.value))}
            placeholder={"contents=read\npull-requests=write"}
            rows={2}
            value={formatKeyValueLines(data.permissions ?? {})}
          />
        </label>
      </Section>

      {/* Outputs */}
      <Section title={text.outputs}>
        <label className="grid gap-1 text-[10px] uppercase font-semibold text-slate-400 mt-1.5">
          <span className="text-[9px] text-slate-500 lowercase font-normal mb-0.5">{text.outputsHelp}</span>
          <textarea
            className="w-full rounded border border-slate-700 bg-slate-950/70 px-2 py-2 text-[11px] font-normal text-slate-100 font-mono normal-case leading-relaxed"
            onChange={(e) => update('outputs', parseKeyValueLines(e.currentTarget.value))}
            placeholder={"artifact-id=${{ steps.upload.outputs.artifact-id }}"}
            rows={2}
            value={formatKeyValueLines(data.outputs ?? {})}
          />
        </label>
      </Section>

      {/* Advanced */}
      <Section title="Advanced">
        <FieldInput label={text.timeoutMinutes} value={data.timeoutMinutes ?? ''} onChange={(v) => update('timeoutMinutes', v)} placeholder="60" />
        <label className="flex items-center gap-2.5 text-[11px] text-slate-300 py-1.5 cursor-pointer">
          <input
            checked={data.continueOnError ?? false}
            className="size-4 rounded border border-slate-600 bg-slate-950/80 accent-amber-500"
            onChange={(e) => update('continueOnError', e.currentTarget.checked)}
            type="checkbox"
          />
          {text.continueOnError}
        </label>
        <FieldInput label={text.containerImage} value={data.container ?? ''} onChange={(v) => update('container', v)} placeholder="node:20-alpine" mono />
        <FieldInput label={text.environmentName} value={data.environment ?? ''} onChange={(v) => update('environment', v)} placeholder="production" mono />
        <FieldInput label={text.environmentUrl} value={data.environmentUrl ?? ''} onChange={(v) => update('environmentUrl', v)} placeholder="https://my-app.com" mono />
      </Section>

      <Handle type="source" position={Position.Right} id="job-output" className="!w-6 !h-6 !bg-slate-800 !border-[3px] !border-white hover:!bg-white transition-colors cursor-crosshair" />
      <Handle type="source" position={Position.Bottom} id="job-step-output" className="!w-6 !h-6 !bg-slate-800 !border-[3px] !border-white hover:!bg-white transition-colors cursor-crosshair" />
    </div>
  )
}
