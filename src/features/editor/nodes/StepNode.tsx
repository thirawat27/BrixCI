import { Handle, Position, type NodeProps } from '@xyflow/react'
import { ListChecks, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { STEP_MODES, type StepFlowNode, type StepMode } from '../../../domain/graph'
import { useI18n } from '../../../i18n'
import { formatKeyValueLines, parseKeyValueLines } from '../../../lib/textMaps'
import { useEditorStore } from '../../../store/editorStore'

const SHELL_OPTIONS = ['bash', 'sh', 'pwsh', 'powershell', 'cmd', 'python']

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

export function StepNode({ id, data, selected }: NodeProps<StepFlowNode>) {
  const updateNodeData = useEditorStore((state) => state.updateNodeData)
  const { text } = useI18n()

  const update = <K extends keyof typeof data>(key: K, value: typeof data[K]) => {
    updateNodeData(id, (current) => ({ ...current, [key]: value }))
  }

  return (
    <div
      className={`grid min-w-[280px] max-w-[340px] gap-3 rounded-2xl border bg-slate-900/95 p-5 shadow-xl backdrop-blur-md ${
        selected ? 'border-emerald-400 ring-1 ring-emerald-300/50' : 'border-slate-700'
      }`}
    >
      <Handle type="target" position={Position.Left} />
      <div className="flex items-center gap-2 border-b border-dashed border-slate-600 pb-2 text-[11px] font-bold uppercase tracking-widest text-emerald-300">
        <ListChecks size={14} className="opacity-80" />
        {text.stepNode}
      </div>

      {/* Core fields */}
      <FieldInput label={text.name} value={data.label} onChange={(v) => update('label', v)} />
      <FieldInput label={text.stepIdOptional} value={data.stepId ?? ''} onChange={(v) => update('stepId', v)} placeholder="step-id" mono />

      <label className="grid gap-1 text-[10px] uppercase font-semibold text-slate-400 mt-1.5">
        {text.mode}
        <select
          className="w-full rounded border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-[11px] font-normal text-slate-100 normal-case mb-1.5"
          value={data.mode}
          onChange={(e) => update('mode', e.currentTarget.value as StepMode)}
        >
          {STEP_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {mode === 'run' ? 'run (shell command)' : 'uses (action)'}
            </option>
          ))}
        </select>
      </label>

      {data.mode === 'run' ? (
        <>
          <label className="grid gap-1 text-[10px] uppercase font-semibold text-slate-400 mt-1.5">
            {text.command}
            <textarea
              className="w-full rounded border border-slate-700 bg-slate-950/70 px-2 py-2 text-[11px] font-normal text-slate-100 font-mono normal-case mb-1.5 leading-relaxed"
              rows={3}
              value={data.runCommand}
              onChange={(e) => update('runCommand', e.currentTarget.value)}
              placeholder="npm run test"
            />
          </label>
          <label className="grid gap-1 text-[10px] uppercase font-semibold text-slate-400 mt-1.5">
            {text.shell}
            <select
              className="w-full rounded border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-[11px] font-normal text-slate-100 normal-case mb-1.5"
              value={data.shell ?? ''}
              onChange={(e) => update('shell', e.currentTarget.value)}
            >
              <option value="">default</option>
              {SHELL_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
        </>
      ) : (
        <>
          <FieldInput label={text.action} value={data.actionRef} onChange={(v) => update('actionRef', v)} placeholder="actions/checkout@v4" mono />
          <label className="grid gap-1 text-[10px] uppercase font-semibold text-slate-400 mt-1.5">
            {text.withParams}
            <textarea
              className="w-full rounded border border-slate-700 bg-slate-950/70 px-2 py-2 text-[11px] font-normal text-slate-100 font-mono normal-case leading-relaxed"
              rows={2}
              value={formatKeyValueLines(data.withParams)}
              onChange={(e) => update('withParams', parseKeyValueLines(e.currentTarget.value))}
              placeholder={"token=${{ secrets.GITHUB_TOKEN }}\nfetch-depth=0"}
            />
          </label>
        </>
      )}

      {/* Conditions & Advanced */}
      <Section title={text.advancedControl}>
        <FieldInput
          label={text.ifCondition}
          value={data.ifCondition ?? ''}
          onChange={(v) => update('ifCondition', v)}
          placeholder="always() || failure()"
          mono
        />
        <FieldInput
          label={text.timeoutMinutes}
          value={data.timeoutMinutes ?? ''}
          onChange={(v) => update('timeoutMinutes', v)}
          placeholder="30"
        />
        <label className="flex items-center gap-2.5 text-[11px] text-slate-300 py-1.5 cursor-pointer">
          <input
            checked={data.continueOnError ?? false}
            className="size-4 rounded border border-slate-600 bg-slate-950/80 accent-emerald-500"
            onChange={(e) => update('continueOnError', e.currentTarget.checked)}
            type="checkbox"
          />
          {text.continueOnError}
        </label>
        <FieldInput
          label={text.workingDirectory}
          value={data.workingDirectory ?? ''}
          onChange={(v) => update('workingDirectory', v)}
          placeholder="./packages/my-app"
          mono
        />
      </Section>

      {/* Environment Variables */}
      <Section title={text.environmentVars}>
        <label className="grid gap-1 text-[10px] uppercase font-semibold text-slate-400 mt-1.5">
          {text.env}
          <textarea
            className="w-full rounded border border-slate-700 bg-slate-950/70 px-2 py-2 text-[11px] font-normal text-slate-100 font-mono normal-case leading-relaxed"
            onChange={(e) => update('env', parseKeyValueLines(e.currentTarget.value))}
            placeholder="CI=true\nNODE_ENV=test"
            rows={2}
            value={formatKeyValueLines(data.env)}
          />
        </label>
      </Section>

      <div className="mt-2 rounded-lg border border-dashed border-slate-600/60 px-2.5 py-1.5 text-[11px] text-slate-400 text-center font-medium bg-slate-800/10">
        {text.jobRef}: {data.jobNodeId || text.unassigned}
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  )
}
