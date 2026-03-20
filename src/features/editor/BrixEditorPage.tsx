import { startTransition, useDeferredValue, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  AlertCircle,
  Blocks,
  ChevronDown,
  CheckCircle2,
  Copy,
  Download,
  FileCode,
  Github,
  GitBranch,
  Languages,
  LogIn,
  Menu,
  Play,
  Plus,
  Redo2,
  RotateCcw,
  ShieldCheck,
  Undo2,
  Upload,
  Workflow,
  X,
} from 'lucide-react'
import { EditorCanvas } from './components/EditorCanvas'
import { compileGraphToYaml, parseWorkflowYaml } from '../../domain/compiler'
import { parseGraphDraft } from '../../domain/graph'
import { builtInTemplates } from '../../domain/templates'
import type { ValidationIssue } from '../../domain/graph'
import { useI18n, UI_DICTIONARY, UI_LANGUAGES, type UiLanguage } from '../../i18n'
import { downloadTextFile } from '../../lib/download'
import { formatKeyValueLines, parseKeyValueLines } from '../../lib/textMaps'
import { useEditorStore } from '../../store/editorStore'
import { useAuthStore } from '../../store/authStore'
import { LoginModal } from '../auth/LoginModal'
import { UserMenu } from '../auth/UserMenu'
import { DeployModal } from '../auth/DeployModal'

const DRAFT_STORAGE_KEY = 'brixci-editor-draft-v1'

type StatusTone = 'success' | 'error' | 'info'

interface StatusMessage {
  tone: StatusTone
  message: string
}

const panelBlockClass = 'glass-card p-4'
type ToolbarMenuVariant = 'dropdown' | 'accordion'

function toExportFilename(workflowName: string, extension: 'yml' | 'json'): string {
  const normalized = workflowName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  const baseName = normalized || 'brixci-workflow'
  return `${baseName}.${extension}`
}

function StatusIcon({ tone }: { tone: StatusTone }) {
  if (tone === 'success') {
    return <CheckCircle2 size={16} />
  }
  if (tone === 'error') {
    return <AlertCircle size={16} />
  }
  return <ShieldCheck size={16} />
}

function StatusToast({ status }: { status: StatusMessage }) {
  return (
    <div className="pointer-events-none fixed right-3 top-3 z-40 w-[min(24rem,calc(100vw-1.5rem))] md:right-4 md:top-4">
      <div
        className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-[0_24px_48px_rgba(0,0,0,0.34)] backdrop-blur-xl ${
          status.tone === 'success'
            ? 'border-emerald-500/40 bg-emerald-950/90 text-emerald-100'
            : status.tone === 'error'
              ? 'border-rose-500/45 bg-rose-950/90 text-rose-100'
              : 'border-sky-500/40 bg-sky-950/90 text-sky-100'
        }`}
        aria-live="polite"
        role="status"
      >
        <div className="mt-0.5 shrink-0">
          <StatusIcon tone={status.tone} />
        </div>
        <div className="min-w-0 leading-5">{status.message}</div>
      </div>
    </div>
  )
}

function MetricPill({
  icon,
  children,
  tone = 'default',
}: {
  icon: ReactNode
  children: ReactNode
  tone?: 'default' | 'success' | 'danger'
}) {
  const toneClass =
    tone === 'success'
      ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-100'
      : tone === 'danger'
        ? 'border-rose-500/45 bg-rose-950/30 text-rose-100'
        : 'border-slate-700 bg-slate-900/85 text-slate-300'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs ${toneClass}`}
    >
      {icon}
      {children}
    </span>
  )
}

function ToolbarMenu({
  label,
  icon,
  children,
  variant = 'dropdown',
}: {
  label: string
  icon: ReactNode
  children: (closeMenu: () => void) => ReactNode
  variant?: ToolbarMenuVariant
}) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open || variant !== 'dropdown') {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, variant])

  useEffect(() => {
    if (!open || variant === 'dropdown') {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, variant])

  return (
    <div className={`relative ${variant === 'accordion' ? 'w-full' : ''}`} ref={menuRef}>
      <button
        aria-expanded={open}
        className={`inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/90 px-3 py-2 font-semibold text-slate-100 transition hover:-translate-y-px hover:brightness-110 ${
          variant === 'accordion' ? 'w-full justify-between text-sm' : 'text-xs'
        }`}
        onClick={() => {
          setOpen((current) => !current)
        }}
        type="button"
      >
        <span className="inline-flex items-center gap-2">
          {icon}
          {label}
        </span>
        <ChevronDown className={`transition ${open ? 'rotate-180' : ''}`} size={14} />
      </button>

      {open && (
        variant === 'accordion' ? (
          <div className="mt-2 rounded-2xl border border-slate-800 bg-slate-950/94 p-2 shadow-[0_18px_36px_rgba(0,0,0,0.24)] backdrop-blur-xl">
            <div className="grid gap-1">{children(() => setOpen(false))}</div>
          </div>
        ) : (
          <div className="absolute left-0 top-full z-30 mt-2 min-w-[210px] rounded-2xl border border-slate-800 bg-slate-950/96 p-2 shadow-[0_24px_48px_rgba(0,0,0,0.34)] backdrop-blur-xl">
            <div className="grid gap-1">{children(() => setOpen(false))}</div>
          </div>
        )
      )}
    </div>
  )
}

function ToolbarMenuItem({
  icon,
  children,
  onClick,
  disabled = false,
  tone = 'default',
}: {
  icon: ReactNode
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  tone?: 'default' | 'danger'
}) {
  return (
    <button
      className={`inline-flex min-h-10 w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45 ${
        tone === 'danger'
          ? 'border-rose-500/35 bg-rose-950/20 text-rose-100'
          : 'border-slate-800 bg-slate-900/90 text-slate-100'
      }`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {icon}
      {children}
    </button>
  )
}

function IssuesPanel() {
  const issues = useEditorStore((state) => state.issues)
  const { text, issueMessage } = useI18n()
  const errorCount = issues.filter((issue) => issue.severity === 'error').length
  const warningCount = issues.filter((issue) => issue.severity === 'warning').length

  return (
    <section className={panelBlockClass}>
      <h2 className="mb-2 text-sm font-semibold text-slate-100">{text.validation}</h2>
      <p className="mb-2 text-xs text-slate-400">
        {errorCount} / {warningCount} {text.errorsAndWarnings}
      </p>
      <div className="space-y-2">
        {issues.length === 0 && <p className="text-xs text-slate-400">{text.noGraphIssues}</p>}
        {issues.map((issue, index) => (
          <article
            className={`rounded-lg border px-2.5 py-2 ${
              issue.severity === 'error'
                ? 'border-rose-500/45 bg-rose-950/30'
                : 'border-amber-400/35 bg-amber-950/20'
            }`}
            key={`${issue.code}-${issue.edgeId ?? ''}-${issue.nodeId ?? ''}-${index}`}
          >
            <strong className="block text-[11px] text-slate-100">{issue.code}</strong>
            <p className="mt-1 text-xs text-slate-300" title={issue.message}>
              {issueMessage(issue)}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}

function WorkflowPanel() {
  const workflowName = useEditorStore((state) => state.workflowName)
  const workflowEnv = useEditorStore((state) => state.workflowEnv)
  const setWorkflowName = useEditorStore((state) => state.setWorkflowName)
  const setWorkflowEnv = useEditorStore((state) => state.setWorkflowEnv)
  const { text } = useI18n()

  return (
    <section className={panelBlockClass}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-100">{text.workflow}</h2>
        <Workflow size={16} />
      </div>

      <label className="grid gap-1 text-[11px] text-slate-300">
        {text.workflowName}
        <input
          className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-2 text-sm text-slate-100"
          onChange={(event) => {
            setWorkflowName(event.currentTarget.value)
          }}
          placeholder="BrixCI Pipeline"
          type="text"
          value={workflowName}
        />
      </label>

      <label className="grid gap-1 text-[11px] text-slate-300">
        {text.env}
        <textarea
          className="min-h-24 w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-2 text-xs text-slate-100"
          onChange={(event) => {
            setWorkflowEnv(parseKeyValueLines(event.currentTarget.value))
          }}
          placeholder="NODE_ENV=production"
          rows={4}
          value={formatKeyValueLines(workflowEnv)}
        />
      </label>

      <p className="mt-2 text-xs leading-5 text-slate-400">{text.workflowNameHelp}</p>
      <p className="text-xs leading-5 text-slate-400">{text.envHelp}</p>
    </section>
  )
}

function InspectorPanel() {
  const selectedNode = useEditorStore((state) =>
    state.graph.nodes.find((node) => node.id === state.selectedNodeId),
  )
  const removeSelectedNode = useEditorStore((state) => state.removeSelectedNode)
  const { text } = useI18n()

  const getNodeHelp = (type: string) => {
    switch(type) {
      case 'trigger': return text.learningTrigger
      case 'job': return text.learningJob
      case 'step': return text.learningStep
      default: return ''
    }
  }

  return (
    <section className={panelBlockClass}>
      <h2 className="mb-2 text-sm font-semibold text-slate-100">{text.inspector}</h2>
      
      {!selectedNode ? (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">{text.selectNode}</p>
          <div className="rounded-lg border border-sky-500/20 bg-sky-950/20 p-3">
            <h3 className="mb-1.5 text-[13px] font-semibold text-sky-200">
              {text.learningTitle}
            </h3>
            <p className="text-[11px] leading-relaxed text-sky-100/70">
              {text.learningSubtitle}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-3 rounded-lg border border-sky-500/20 bg-sky-950/20 p-3">
            <p className="mb-1 text-[11px] font-semibold text-sky-300">{text.learningWhatIsThis}</p>
            <p className="text-[11px] leading-relaxed text-sky-100/80">
              {getNodeHelp(selectedNode.type)}
            </p>
          </div>
          
          <div className="mb-2 grid gap-1">
            <span className="text-[11px] text-slate-400">{text.nodeId}</span>
            <code className="rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-xs text-slate-200 font-sans">
              {selectedNode.id}
            </code>
          </div>
          <div className="mb-2 grid gap-1">
            <span className="text-[11px] text-slate-400">{text.nodeType}</span>
            <code className="rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-xs text-slate-200 font-sans">
              {selectedNode.type}
            </code>
          </div>
          <div className="mb-3 grid gap-1">
            <span className="text-[11px] text-slate-400">{text.nodeData}</span>
            <pre className="max-h-[280px] overflow-auto rounded-md border border-slate-700 bg-slate-950/70 p-2 text-[11px] text-slate-200 font-sans">
              {JSON.stringify(selectedNode.data, null, 2)}
            </pre>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-md border border-rose-700/80 bg-rose-950/60 px-3 py-2 text-xs font-semibold text-rose-100 hover:brightness-110"
            onClick={removeSelectedNode}
            type="button"
          >
            {text.deleteNode}
          </button>
        </>
      )}
    </section>
  )
}

function OutputPanel({ onCopyYaml }: { onCopyYaml: () => Promise<void> }) {
  const yamlOutput = useEditorStore((state) => state.yamlOutput)
  const { text } = useI18n()

  return (
    <section className={panelBlockClass}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-100">{text.yamlOutput}</h2>
        <button
          className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800/80 px-2 py-1 text-xs font-semibold text-slate-100 hover:brightness-110"
          onClick={() => void onCopyYaml()}
          type="button"
        >
          <Copy size={14} />
          {text.copyYaml}
        </button>
      </div>
      <textarea
        className="min-h-[320px] max-h-[62vh] w-full resize-y rounded-md border border-slate-700 bg-slate-950/80 p-3 text-xs leading-5 text-slate-100"
        placeholder={text.yamlPlaceholder}
        readOnly
        value={yamlOutput}
      />
    </section>
  )
}

function hasBlockingErrors(issues: ValidationIssue[]): boolean {
  return issues.some((issue) => issue.severity === 'error')
}

function iconButtonClass(
  tone: 'sky' | 'amber' | 'emerald' | 'neutral' | 'success' | 'danger' = 'neutral',
): string {
  const baseClass =
    'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold text-slate-100 transition hover:-translate-y-px hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45'

  const toneClass =
    tone === 'sky'
      ? 'border-sky-500/65 bg-gradient-to-br from-sky-950 to-sky-800/90 shadow-[0_12px_24px_rgba(14,116,144,0.18)]'
      : tone === 'amber'
        ? 'border-amber-500/55 bg-gradient-to-br from-amber-950 to-amber-800/80 shadow-[0_12px_24px_rgba(180,83,9,0.18)]'
        : tone === 'emerald'
          ? 'border-emerald-500/55 bg-gradient-to-br from-emerald-950 to-emerald-800/80 shadow-[0_12px_24px_rgba(6,95,70,0.18)]'
          : tone === 'success'
            ? 'border-emerald-500/45 bg-emerald-950/30'
            : tone === 'danger'
              ? 'border-rose-500/45 bg-rose-950/25'
              : 'border-slate-700 bg-slate-800/85'

  return `${baseClass} ${toneClass}`
}

export function BrixEditorPage() {
  const addNode = useEditorStore((state) => state.addNode)
  const validate = useEditorStore((state) => state.validate)
  const compile = useEditorStore((state) => state.compile)
  const undo = useEditorStore((state) => state.undo)
  const redo = useEditorStore((state) => state.redo)
  const reset = useEditorStore((state) => state.reset)
  const replaceGraph = useEditorStore((state) => state.replaceGraph)
  const graph = useEditorStore((state) => state.graph)
  const issues = useEditorStore((state) => state.issues)
  const yamlOutput = useEditorStore((state) => state.yamlOutput)
  const workflowName = useEditorStore((state) => state.workflowName)
  const workflowEnv = useEditorStore((state) => state.workflowEnv)
  const historyPastCount = useEditorStore((state) => state.historyPast.length)
  const historyFutureCount = useEditorStore((state) => state.historyFuture.length)
  const { language, setLanguage, text } = useI18n()
  const { user, logout } = useAuthStore()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showDeployModal, setShowDeployModal] = useState(false)
  const [isToolbarMenuOpen, setIsToolbarMenuOpen] = useState(false)

  const deferredGraph = useDeferredValue(graph)
  const importGraphInputRef = useRef<HTMLInputElement>(null)
  const importYamlInputRef = useRef<HTMLInputElement>(null)
  const didRestoreDraft = useRef(false)
  const [status, setStatus] = useState<StatusMessage | null>(null)
  const [rightPanelTab, setRightPanelTab] = useState<'inspector' | 'yaml'>('yaml')

  useEffect(() => {
    if (!status) {
      return
    }
    const timer = window.setTimeout(() => {
      setStatus(null)
    }, 3000)
    return () => {
      window.clearTimeout(timer)
    }
  }, [status])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) {
        setIsToolbarMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    if (didRestoreDraft.current) {
      return
    }

    didRestoreDraft.current = true
    const rawDraft = localStorage.getItem(DRAFT_STORAGE_KEY)
    if (!rawDraft) {
      return
    }

    try {
      const parsedDraft = parseGraphDraft(JSON.parse(rawDraft))
      startTransition(() => {
        replaceGraph(
          parsedDraft.graph,
          parsedDraft.yamlOutput ?? '',
          parsedDraft.workflowName,
          parsedDraft.workflowEnv,
        )
      })
      window.setTimeout(() => {
        setStatus({
          tone: 'info',
          message: text.restoredDraft,
        })
      }, 0)
    } catch {
      localStorage.removeItem(DRAFT_STORAGE_KEY)
    }
  }, [replaceGraph, text.restoredDraft])

  useEffect(() => {
    if (!didRestoreDraft.current) {
      return
    }
    localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({
        graph: deferredGraph,
        yamlOutput,
        workflowName,
        workflowEnv,
      }),
    )
  }, [deferredGraph, workflowEnv, workflowName, yamlOutput])

  const runCompile = (): string | null => {
    const compiled = compile()
    if (compiled) {
      setStatus({
        tone: 'success',
        message: text.compileSuccess,
      })
      return compiled
    }

    setStatus({
      tone: 'error',
      message: text.compileFailed,
    })
    return null
  }

  const runExportYaml = (): void => {
    const compiled = runCompile()
    if (!compiled) {
      return
    }
    downloadTextFile(toExportFilename(workflowName, 'yml'), compiled, 'text/yaml;charset=utf-8')
    setStatus({
      tone: 'success',
      message: text.exportSuccess,
    })
  }

  const runCopyYaml = async (): Promise<void> => {
    const content = yamlOutput || runCompile()
    if (!content) {
      return
    }

    try {
      await navigator.clipboard.writeText(content)
      setStatus({
        tone: 'success',
        message: text.copySuccess,
      })
    } catch {
      setStatus({
        tone: 'error',
        message: text.copyFailed,
      })
    }
  }



  useEffect(() => {
    const compileForShortcut = (): string | null => {
      const compiled = compile()
      if (compiled) {
        setStatus({
          tone: 'success',
          message: text.compileSuccess,
        })
        return compiled
      }

      setStatus({
        tone: 'error',
        message: text.compileFailed,
      })
      return null
    }

    const exportYamlForShortcut = (): void => {
      const compiled = compileForShortcut()
      if (!compiled) {
        return
      }
      downloadTextFile(toExportFilename(workflowName, 'yml'), compiled, 'text/yaml;charset=utf-8')
      setStatus({
        tone: 'success',
        message: text.exportSuccess,
      })
    }

    const listener = (event: KeyboardEvent) => {
      const hasModifier = event.metaKey || event.ctrlKey
      if (!hasModifier) {
        return
      }

      const key = event.key.toLowerCase()
      if (key === 'z' && !event.shiftKey) {
        event.preventDefault()
        undo()
        return
      }

      if (key === 'y' || (key === 'z' && event.shiftKey)) {
        event.preventDefault()
        redo()
        return
      }

      if (key === 's') {
        event.preventDefault()
        exportYamlForShortcut()
        return
      }

      if (key === 'enter') {
        event.preventDefault()
        compileForShortcut()
      }
    }

    window.addEventListener('keydown', listener)
    return () => {
      window.removeEventListener('keydown', listener)
    }
  }, [
    compile,
    redo,
    text.compileFailed,
    text.compileSuccess,
    text.exportSuccess,
    undo,
    workflowName,
  ])

  const errorCount = issues.filter((issue) => issue.severity === 'error').length
  const warningCount = issues.filter((issue) => issue.severity === 'warning').length
  const closeToolbarMenu = () => {
    setIsToolbarMenuOpen(false)
  }
  const renderMetricPills = () => (
    <>
      <MetricPill icon={<Workflow size={13} />}>
        {text.nodes}: {graph.nodes.length}
      </MetricPill>
      <MetricPill icon={<GitBranch size={13} />}>
        {text.edges}: {graph.edges.length}
      </MetricPill>
      <MetricPill icon={<ShieldCheck size={13} />} tone={errorCount > 0 ? 'danger' : 'success'}>
        {errorCount} / {warningCount} {text.errorsAndWarnings}
      </MetricPill>
      <MetricPill icon={<CheckCircle2 size={13} />}>{text.autosaveOn}</MetricPill>
    </>
  )
  const renderToolbarActions = ({
    mobile = false,
    onActionComplete,
  }: {
    mobile?: boolean
    onActionComplete?: () => void
  } = {}) => {
    const menuVariant: ToolbarMenuVariant = mobile ? 'accordion' : 'dropdown'
    const finalizeAction = () => {
      onActionComplete?.()
    }

    return (
      <div className={mobile ? 'grid gap-2' : 'flex flex-wrap items-center gap-2'}>
        <ToolbarMenu icon={<Plus size={14} />} label={text.groupCreate} variant={menuVariant}>
          {(closeMenu) => (
            <>
              <ToolbarMenuItem
                icon={<Plus size={14} />}
                onClick={() => {
                  addNode('trigger')
                  closeMenu()
                  finalizeAction()
                }}
              >
                {text.addTrigger}
              </ToolbarMenuItem>
              <ToolbarMenuItem
                icon={<Plus size={14} />}
                onClick={() => {
                  addNode('job')
                  closeMenu()
                  finalizeAction()
                }}
              >
                {text.addJob}
              </ToolbarMenuItem>
              <ToolbarMenuItem
                icon={<Plus size={14} />}
                onClick={() => {
                  addNode('step')
                  closeMenu()
                  finalizeAction()
                }}
              >
                {text.addStep}
              </ToolbarMenuItem>
            </>
          )}
        </ToolbarMenu>

        <ToolbarMenu
          icon={<Blocks size={14} />}
          label={text.templates || 'Templates'}
          variant={menuVariant}
        >
          {(closeMenu) => (
            <div
              className={`grid gap-1 overflow-y-auto overflow-x-hidden pr-1 ${
                mobile ? 'max-h-[min(24rem,55vh)]' : 'max-h-[60vh] w-[340px]'
              }`}
            >
              {builtInTemplates.map((template) => (
                <ToolbarMenuItem
                  key={template.id}
                  icon={
                    <div className="mt-0.5 shrink-0">
                      <Blocks size={14} />
                    </div>
                  }
                  onClick={() => {
                    if (
                      window.confirm(
                        `Load ${template.label[language]} Template? This will replace your current workflow.`,
                      )
                    ) {
                      replaceGraph(template.graph, '', template.label[language], {})
                      setTimeout(() => {
                        useEditorStore.getState().autoLayout()
                      }, 100)
                      closeMenu()
                      finalizeAction()
                    }
                  }}
                >
                  <div className="min-w-0 flex flex-col gap-0.5">
                    <span className="break-words leading-tight">{template.label[language]}</span>
                    <span className="break-words text-[10px] font-normal leading-snug text-slate-400">
                      {template.description[language]}
                    </span>
                  </div>
                </ToolbarMenuItem>
              ))}
            </div>
          )}
        </ToolbarMenu>

        <button
          className={`${iconButtonClass('success')} ${mobile ? 'w-full justify-start text-sm' : ''}`}
          onClick={() => {
            const result = validate()
            setStatus({
              tone: hasBlockingErrors(result) ? 'error' : 'success',
              message: hasBlockingErrors(result) ? text.validateFailed : text.validatePassed,
            })
            finalizeAction()
          }}
          title={text.validate}
          type="button"
        >
          <ShieldCheck size={14} />
          {text.validate}
        </button>

        <button
          className={`${iconButtonClass('sky')} ${mobile ? 'w-full justify-start text-sm' : ''}`}
          onClick={() => {
            runCompile()
            finalizeAction()
          }}
          title={text.compile}
          type="button"
        >
          <Play size={14} />
          {text.compile}
        </button>

        <ToolbarMenu icon={<Download size={14} />} label={text.groupBuild} variant={menuVariant}>
          {(closeMenu) => (
            <>
              <ToolbarMenuItem
                icon={<Download size={14} />}
                onClick={() => {
                  runExportYaml()
                  closeMenu()
                  finalizeAction()
                }}
              >
                {text.exportYaml}
              </ToolbarMenuItem>
              <ToolbarMenuItem
                icon={<Copy size={14} />}
                onClick={() => {
                  void runCopyYaml().finally(() => {
                    closeMenu()
                    finalizeAction()
                  })
                }}
              >
                {text.copyYaml}
              </ToolbarMenuItem>
              <ToolbarMenuItem
                icon={<Github size={14} />}
                onClick={() => {
                  if (!yamlOutput) {
                    runCompile()
                  }
                  setShowDeployModal(true)
                  closeMenu()
                  finalizeAction()
                }}
              >
                Deploy to GitHub
              </ToolbarMenuItem>
            </>
          )}
        </ToolbarMenu>

        <ToolbarMenu icon={<Upload size={14} />} label={text.groupTransfer} variant={menuVariant}>
          {(closeMenu) => (
            <>
              <ToolbarMenuItem
                icon={<FileCode size={14} />}
                onClick={() => {
                  downloadTextFile(
                    toExportFilename(workflowName, 'json'),
                    JSON.stringify({ graph, yamlOutput, workflowName, workflowEnv }, null, 2),
                    'application/json;charset=utf-8',
                  )
                  closeMenu()
                  finalizeAction()
                }}
              >
                {text.exportGraphJson}
              </ToolbarMenuItem>
              <ToolbarMenuItem
                icon={<Upload size={14} />}
                onClick={() => {
                  importYamlInputRef.current?.click()
                  closeMenu()
                  finalizeAction()
                }}
              >
                {text.importYaml}
              </ToolbarMenuItem>
              <ToolbarMenuItem
                icon={<Upload size={14} />}
                onClick={() => {
                  importGraphInputRef.current?.click()
                  closeMenu()
                  finalizeAction()
                }}
              >
                {text.importGraphJson}
              </ToolbarMenuItem>
            </>
          )}
        </ToolbarMenu>

        <ToolbarMenu icon={<Undo2 size={14} />} label={text.groupHistory} variant={menuVariant}>
          {(closeMenu) => (
            <>
              <ToolbarMenuItem
                disabled={historyPastCount === 0}
                icon={<Undo2 size={14} />}
                onClick={() => {
                  undo()
                  closeMenu()
                  finalizeAction()
                }}
              >
                {text.undo}
              </ToolbarMenuItem>
              <ToolbarMenuItem
                disabled={historyFutureCount === 0}
                icon={<Redo2 size={14} />}
                onClick={() => {
                  redo()
                  closeMenu()
                  finalizeAction()
                }}
              >
                {text.redo}
              </ToolbarMenuItem>
              <ToolbarMenuItem
                icon={<RotateCcw size={14} />}
                onClick={() => {
                  if (!window.confirm(text.resetConfirm)) {
                    return
                  }
                  reset()
                  closeMenu()
                  finalizeAction()
                }}
                tone="danger"
              >
                {text.reset}
              </ToolbarMenuItem>
            </>
          )}
        </ToolbarMenu>
      </div>
    )
  }

  return (
    <div className="flex min-h-[100dvh] flex-col font-sans text-slate-100">
      <header className="relative z-20 border-b border-slate-800/80 bg-slate-950/88 px-3 py-3 backdrop-blur-xl md:px-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex size-14 items-center justify-center overflow-hidden rounded-2xl border border-sky-400/20 bg-sky-500/10 p-2 shadow-[0_18px_36px_rgba(14,116,144,0.15)]">
                  <img
                    alt="BrixCI logo"
                    className="size-full object-contain"
                    height={40}
                    src="/BrixCI.png"
                    width={40}
                  />
                </div>
                <div>
                  <h1 className="text-lg font-semibold leading-tight">{text.appTitle}</h1>
                  <p className="text-sm text-slate-400">{text.appSubtitle}</p>
                </div>
              </div>

              <button
                aria-controls="toolbar-mobile-panel"
                aria-expanded={isToolbarMenuOpen}
                aria-label="Toggle toolbar menu"
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/90 px-3 py-2 text-slate-100 shadow-[0_18px_36px_rgba(0,0,0,0.18)] transition hover:-translate-y-px hover:brightness-110 xl:hidden"
                onClick={() => {
                  setIsToolbarMenuOpen((current) => !current)
                }}
                type="button"
              >
                {isToolbarMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center xl:justify-end">
              <a
                className="hidden min-h-10 items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/85 px-4 py-2 text-sm font-semibold text-slate-100 shadow-[0_18px_36px_rgba(0,0,0,0.18)] transition hover:-translate-y-px hover:border-slate-500 hover:bg-slate-800 sm:inline-flex"
                href="https://github.com/thirawat27/BrixCI"
                rel="noreferrer"
                target="_blank"
                title="Star us on GitHub"
              >
                <Github size={18} />
                <span>Star on GitHub</span>
              </a>

              {user ? (
                <UserMenu user={user} onLogout={logout} />
              ) : (
                <button
                  className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-sky-500/50 bg-gradient-to-br from-sky-950 to-sky-800/80 px-4 py-2 text-sm font-semibold text-sky-100 shadow-[0_8px_24px_rgba(14,116,144,0.22)] transition hover:-translate-y-px hover:brightness-110 sm:w-auto"
                  id="github-login-trigger-btn"
                  onClick={() => setShowLoginModal(true)}
                  type="button"
                >
                  <LogIn size={15} />
                  Sign in with GitHub
                </button>
              )}

              <label className="inline-flex min-h-10 w-full items-center justify-between gap-2 rounded-xl border border-slate-700 bg-slate-900/85 px-3 py-2 text-xs font-semibold text-slate-100 shadow-[0_18px_36px_rgba(0,0,0,0.18)] sm:w-auto sm:justify-start">
                <span className="inline-flex items-center gap-2">
                  <Languages size={14} />
                  <span>{text.language}</span>
                </span>
                <select
                  className="min-w-[74px] bg-transparent text-xs outline-none"
                  onChange={(event) => {
                    setLanguage(event.currentTarget.value as UiLanguage)
                  }}
                  value={language}
                >
                  {UI_LANGUAGES.map((lang) => (
                    <option className="bg-slate-900 text-slate-100" key={lang} value={lang}>
                      {UI_DICTIONARY[lang].languageName}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center xl:hidden">
            {renderMetricPills()}
          </div>

          {isToolbarMenuOpen && (
            <div
              className="glass-card xl:hidden border-slate-800/80 bg-slate-950/80 p-3"
              id="toolbar-mobile-panel"
            >
              {renderToolbarActions({ mobile: true, onActionComplete: closeToolbarMenu })}
            </div>
          )}

          <div className="hidden items-start justify-between gap-3 xl:flex">
            <div className="flex flex-wrap items-center gap-2">
              {renderToolbarActions()}
            </div>

            <div className="flex flex-wrap items-center gap-2 justify-end">
              {renderMetricPills()}
            </div>
          </div>
        </div>
      </header>

      {status && <StatusToast status={status} />}
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
      {showDeployModal && (
        <DeployModal
          workflowName={workflowName}
          yamlContent={yamlOutput}
          onClose={() => setShowDeployModal(false)}
          onRequestLogin={() => setShowLoginModal(true)}
        />
      )}

      <div className="flex flex-1 flex-col min-h-0 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)_17rem] xl:grid-cols-[18.5rem_minmax(0,1fr)_24rem]">
        <aside className="order-2 lg:order-none max-h-[45vh] lg:max-h-none space-y-3 overflow-auto border-t border-slate-800/80 bg-slate-900/55 p-3 lg:border-t-0 lg:border-r">
          <WorkflowPanel />
          <section className={panelBlockClass}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-100">{text.structureFirst}</h2>
              <Blocks size={16} />
            </div>
            <p className="text-xs leading-5 text-slate-400">{text.structureCaption}</p>
          </section>
          <IssuesPanel />
        </aside>

        <main className="order-1 lg:order-none flex-1 lg:min-h-0 min-h-[60svh] bg-slate-950/35 p-2 lg:p-3 flex flex-col">
          <div className="glass-card flex-1 overflow-hidden border-slate-800/80 bg-slate-950/75">
            <EditorCanvas />
          </div>
        </main>

        <aside className="order-3 lg:order-none max-h-[45vh] lg:max-h-none space-y-3 overflow-auto border-t border-slate-800/80 bg-slate-900/55 p-3 lg:border-l lg:border-t-0">
          <div className="grid grid-cols-2 gap-2 lg:hidden">
            <button
              className={`rounded-xl border px-2 py-2 text-xs font-semibold overflow-hidden text-ellipsis whitespace-nowrap ${
                rightPanelTab === 'inspector'
                  ? 'border-sky-500/45 bg-sky-900/30 text-slate-100'
                  : 'border-slate-700 bg-slate-900 text-slate-300'
              }`}
              onClick={() => {
                setRightPanelTab('inspector')
              }}
              type="button"
            >
              {text.tabInspector}
            </button>
            <button
              className={`rounded-xl border px-2 py-2 text-xs font-semibold overflow-hidden text-ellipsis whitespace-nowrap ${
                rightPanelTab === 'yaml'
                  ? 'border-sky-500/45 bg-sky-900/30 text-slate-100'
                  : 'border-slate-700 bg-slate-900 text-slate-300'
              }`}
              onClick={() => {
                setRightPanelTab('yaml')
              }}
              type="button"
            >
              {text.tabYaml}
            </button>
          </div>

          <div className={rightPanelTab === 'inspector' ? 'block' : 'hidden lg:block'}>
            <InspectorPanel />
          </div>
          <div className={rightPanelTab === 'yaml' ? 'block' : 'hidden lg:block'}>
            <OutputPanel onCopyYaml={runCopyYaml} />
          </div>
        </aside>
      </div>

      <input
        accept=".json,application/json"
        className="hidden"
        onChange={async (event) => {
          const file = event.currentTarget.files?.[0]
          event.currentTarget.value = ''
          if (!file) {
            return
          }

          try {
            const raw = await file.text()
            const parsed = parseGraphDraft(JSON.parse(raw))
            startTransition(() => {
              replaceGraph(
                parsed.graph,
                parsed.yamlOutput ?? '',
                parsed.workflowName,
                parsed.workflowEnv,
              )
            })
            setStatus({
              tone: 'success',
              message: text.importSuccess,
            })
          } catch {
            setStatus({
              tone: 'error',
              message: text.importFailed,
            })
          }
        }}
        ref={importGraphInputRef}
        type="file"
      />

      <input
        accept=".yaml,.yml,text/yaml,text/x-yaml,application/x-yaml"
        className="hidden"
        onChange={async (event) => {
          const file = event.currentTarget.files?.[0]
          event.currentTarget.value = ''
          if (!file) {
            return
          }

          try {
            const raw = await file.text()
            const parsed = parseWorkflowYaml(raw)
            let compiledYaml = ''

            try {
              compiledYaml = compileGraphToYaml(
                parsed.graph,
                parsed.workflowName,
                parsed.workflowEnv,
              ).yaml
            } catch {
              compiledYaml = ''
            }

            startTransition(() => {
              replaceGraph(parsed.graph, compiledYaml, parsed.workflowName, parsed.workflowEnv)
            })
            setStatus({
              tone: 'success',
              message: text.importYamlSuccess,
            })
          } catch {
            setStatus({
              tone: 'error',
              message: text.importYamlFailed,
            })
          }
        }}
        ref={importYamlInputRef}
        type="file"
      />
    </div>
  )
}
