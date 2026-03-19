import { useEffect, useRef, useState } from 'react'
import {
  Github,
  Loader2,
  X,
  Send,
  LogIn,
  CheckCircle2,
  AlertCircle,
  FolderGit2,
  FileCode2,
  RefreshCw,
  ExternalLink,
  Lock,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

interface DeployModalProps {
  workflowName: string
  yamlContent: string
  onClose: () => void
  onRequestLogin: () => void
}

interface GitHubRepo {
  full_name: string
  private: boolean
  description: string | null
  pushed_at: string
  html_url: string
}

type DeployStatus = 'idle' | 'deploying' | 'success' | 'error'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

function toExportFilename(name: string): string {
  return (
    name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') ||
    'brixci-workflow'
  ) + '.yml'
}

export function DeployModal({ workflowName, yamlContent, onClose, onRequestLogin }: DeployModalProps) {
  const { user, token } = useAuthStore()

  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [reposLoading, setReposLoading] = useState(false)
  const [reposError, setReposError] = useState<string | null>(null)

  const [repoQuery, setRepoQuery] = useState('')
  const [selectedRepo, setSelectedRepo] = useState<string>('')
  const [customRepo, setCustomRepo] = useState('')
  const [useCustom, setUseCustom] = useState(false)

  const [deployStatus, setDeployStatus] = useState<DeployStatus>('idle')
  const [deployMessage, setDeployMessage] = useState('')
  const [deployedUrl, setDeployedUrl] = useState('')

  const repoInputRef = useRef<HTMLInputElement>(null)

  // Fetch user repos when logged in
  const fetchRepos = async () => {
    if (!token) return
    setReposLoading(true)
    setReposError(null)
    try {
      const res = await fetch(
        'https://api.github.com/user/repos?sort=pushed&per_page=50&affiliation=owner',
        {
          headers: {
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        },
      )
      if (!res.ok) throw new Error(`GitHub API ${res.status}`)
      const data = (await res.json()) as GitHubRepo[]
      setRepos(data)
    } catch (err) {
      setReposError(err instanceof Error ? err.message : 'Failed to load repos')
    } finally {
      setReposLoading(false)
    }
  }

  useEffect(() => {
    if (user && token) fetchRepos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const filename = toExportFilename(workflowName)
  const targetRepo = useCustom ? customRepo.trim() : selectedRepo

  const filteredRepos = repos.filter((r) =>
    r.full_name.toLowerCase().includes(repoQuery.toLowerCase()),
  )

  const handleDeploy = async () => {
    if (!targetRepo || !token || !yamlContent) return
    setDeployStatus('deploying')
    setDeployMessage('')

    try {
      const path = `.github/workflows/${filename}`
      const headers = {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      }

      // Check if file already exists (to get sha for update)
      let sha = ''
      const checkRes = await fetch(
        `https://api.github.com/repos/${targetRepo}/contents/${path}`,
        { headers },
      )
      if (checkRes.ok) {
        const checkData = await checkRes.json() as { sha: string }
        sha = checkData.sha
      }

      // Create or update the workflow file
      const putRes = await fetch(
        `https://api.github.com/repos/${targetRepo}/contents/${path}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            message: `${sha ? 'Update' : 'Add'} ${workflowName} workflow via BrixCI 🧱`,
            content: btoa(unescape(encodeURIComponent(yamlContent))),
            ...(sha ? { sha } : {}),
          }),
        },
      )

      if (!putRes.ok) {
        const errData = await putRes.json().catch(() => ({})) as { message?: string }
        throw new Error(errData.message ?? `HTTP ${putRes.status}`)
      }

      const resultData = await putRes.json() as { content?: { html_url?: string } }
      const fileUrl = resultData.content?.html_url ?? `https://github.com/${targetRepo}/blob/HEAD/${path}`
      setDeployedUrl(fileUrl)
      setDeployStatus('success')
      setDeployMessage(sha ? 'Workflow updated successfully!' : 'Workflow created successfully!')
    } catch (err) {
      setDeployStatus('error')
      setDeployMessage(err instanceof Error ? err.message : 'Deploy failed.')
    }
  }

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!user || !token) {
    return (
      <Overlay onClose={onClose}>
        <ModalShell onClose={onClose} title="Deploy to GitHub">
          <div className="flex flex-col items-center gap-5 py-6 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl border border-sky-500/30 bg-sky-950/50">
              <Github size={26} className="text-sky-300" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Sign in to deploy</h3>
              <p className="mt-1.5 text-sm text-slate-400">
                Connect your GitHub account to deploy workflows directly from BrixCI — no
                copy-pasting required.
              </p>
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-sky-500/50 bg-gradient-to-br from-sky-950 to-sky-800/80 px-6 py-2.5 text-sm font-semibold text-sky-100 shadow-[0_8px_24px_rgba(14,116,144,0.25)] transition hover:brightness-110"
              id="deploy-modal-login-btn"
              onClick={() => { onClose(); onRequestLogin() }}
              type="button"
            >
              <LogIn size={15} />
              Sign in with GitHub
            </button>
          </div>
        </ModalShell>
      </Overlay>
    )
  }

  // ── Logged in ─────────────────────────────────────────────────────────────
  return (
    <Overlay onClose={onClose}>
      <ModalShell onClose={onClose} title="Deploy to GitHub" wide>
        {deployStatus === 'success' ? (
          /* ── Success screen ── */
          <div className="flex flex-col items-center gap-5 py-6 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-950/40">
              <CheckCircle2 size={26} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">{deployMessage}</h3>
              <p className="mt-1 text-sm text-slate-400">
                <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-emerald-300">
                  .github/workflows/{filename}
                </code>{' '}
                has been pushed to{' '}
                <strong className="text-slate-200">{targetRepo}</strong>
              </p>
            </div>
            <div className="flex gap-3">
              <a
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:brightness-110"
                href={deployedUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                <ExternalLink size={14} />
                View on GitHub
              </a>
              <button
                className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:brightness-110"
                onClick={onClose}
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* ── Deploy form ── */
          <div className="space-y-5">
            {/* Identity row */}
            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2.5">
              <img alt={user.login} className="size-8 rounded-lg" src={user.avatar_url} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-100">{user.name || user.login}</p>
                <p className="text-xs text-slate-400">@{user.login}</p>
              </div>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-950/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                Connected
              </span>
            </div>

            {/* Workflow file info */}
            <div className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2.5">
              <FileCode2 size={16} className="shrink-0 text-sky-400" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-400">Will deploy as</p>
                <code className="text-sm font-semibold text-slate-100">
                  .github/workflows/{filename}
                </code>
              </div>
            </div>

            {/* Repo picker */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-200">
                  Select Repository
                </label>
                <div className="flex items-center gap-2">
                  <button
                    className="inline-flex items-center gap-1 text-[11px] text-slate-500 transition hover:text-slate-300"
                    disabled={reposLoading}
                    onClick={fetchRepos}
                    type="button"
                  >
                    <RefreshCw size={11} className={reposLoading ? 'animate-spin' : ''} />
                    Refresh
                  </button>
                  <button
                    className={`text-[11px] transition ${useCustom ? 'text-sky-400' : 'text-slate-500 hover:text-slate-300'}`}
                    onClick={() => { setUseCustom((v) => !v); setSelectedRepo('') }}
                    type="button"
                  >
                    {useCustom ? '← Pick from list' : 'Type manually →'}
                  </button>
                </div>
              </div>

              {useCustom ? (
                /* Manual input */
                <input
                  ref={repoInputRef}
                  autoFocus
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-sky-500/70 focus:ring-1 focus:ring-sky-500/40"
                  onChange={(e) => setCustomRepo(e.currentTarget.value)}
                  placeholder="username/repository-name"
                  type="text"
                  value={customRepo}
                />
              ) : (
                /* Repo list */
                <div className="space-y-1.5">
                  {reposLoading && (
                    <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-500">
                      <Loader2 size={14} className="animate-spin" />
                      Loading repositories…
                    </div>
                  )}
                  {reposError && (
                    <p className="rounded-lg border border-rose-500/30 bg-rose-950/20 px-3 py-2 text-xs text-rose-300">
                      {reposError}
                    </p>
                  )}
                  {!reposLoading && !reposError && (
                    <>
                      <input
                        className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-sky-500/50"
                        onChange={(e) => setRepoQuery(e.currentTarget.value)}
                        placeholder="Search your repositories…"
                        type="text"
                        value={repoQuery}
                      />
                      <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-800 bg-slate-900/40">
                        {filteredRepos.length === 0 && (
                          <p className="py-4 text-center text-xs text-slate-500">No repos found</p>
                        )}
                        {filteredRepos.map((repo) => (
                          <button
                            className={`flex w-full items-center gap-3 border-b border-slate-800/50 px-3 py-2.5 text-left transition last:border-0 hover:bg-slate-800/60 ${
                              selectedRepo === repo.full_name ? 'bg-sky-950/40' : ''
                            }`}
                            key={repo.full_name}
                            onClick={() => setSelectedRepo(repo.full_name)}
                            type="button"
                          >
                            <FolderGit2
                              size={14}
                              className={
                                selectedRepo === repo.full_name ? 'text-sky-400' : 'text-slate-500'
                              }
                            />
                            <div className="min-w-0 flex-1">
                              <p className="flex items-center gap-1.5 truncate text-xs font-semibold text-slate-200">
                                {repo.full_name}
                                {repo.private && (
                                  <Lock size={10} className="shrink-0 text-slate-500" />
                                )}
                              </p>
                              {repo.description && (
                                <p className="truncate text-[10px] text-slate-500">
                                  {repo.description}
                                </p>
                              )}
                            </div>
                            <span className="shrink-0 text-[10px] text-slate-600">
                              {timeAgo(repo.pushed_at)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Error from previous deploy attempt */}
            {deployStatus === 'error' && deployMessage && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-500/35 bg-rose-950/30 px-3 py-2.5">
                <AlertCircle size={14} className="mt-0.5 shrink-0 text-rose-400" />
                <p className="text-xs text-rose-300">{deployMessage}</p>
              </div>
            )}

            {/* Deploy button */}
            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-sky-500/50 bg-gradient-to-br from-sky-900 to-sky-800/80 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(14,116,144,0.25)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!targetRepo || deployStatus === 'deploying'}
              id="deploy-confirm-btn"
              onClick={() => void handleDeploy()}
              type="button"
            >
              {deployStatus === 'deploying' ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Deploying…
                </>
              ) : (
                <>
                  <Send size={14} />
                  Deploy Workflow
                </>
              )}
            </button>
          </div>
        )}
      </ModalShell>
    </Overlay>
  )
}

// ── Helper components ────────────────────────────────────────────────────────

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(12px)', background: 'rgba(2,6,23,0.82)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {children}
    </div>
  )
}

function ModalShell({
  children,
  onClose,
  title,
  wide = false,
}: {
  children: React.ReactNode
  onClose: () => void
  title: string
  wide?: boolean
}) {
  return (
    <div
      className={`relative w-full rounded-3xl border border-slate-700/60 bg-slate-950 shadow-[0_48px_96px_rgba(0,0,0,0.6)] ${wide ? 'max-w-lg' : 'max-w-md'}`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <Github size={16} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
        </div>
        <button
          aria-label="Close"
          className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-slate-200"
          onClick={onClose}
          type="button"
        >
          <X size={15} />
        </button>
      </div>
      <div className="px-6 pb-6 pt-5">{children}</div>
    </div>
  )
}
