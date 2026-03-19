import { useEffect, useRef, useState } from 'react'
import { Github, Key, ExternalLink, Loader2, X, ShieldCheck, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

interface LoginModalProps {
  onClose?: () => void
}

export function LoginModal({ onClose }: LoginModalProps) {
  const [tokenInput, setTokenInput] = useState('')
  const [showToken, setShowToken] = useState(false)
  const { login, isLoading, error, clearError } = useAuthStore()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    return () => clearError()
  }, [clearError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tokenInput.trim()) return
    const ok = await login(tokenInput.trim())
    if (ok) onClose?.()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(12px)', background: 'rgba(2,6,23,0.82)' }}
    >
      <div
        className="relative w-full max-w-md rounded-3xl border border-slate-700/60 bg-slate-950 shadow-[0_48px_96px_rgba(0,0,0,0.6)]"
        role="dialog"
        aria-modal="true"
        aria-label="Sign in with GitHub"
      >
        {/* Close button */}
        {onClose && (
          <button
            aria-label="Close"
            className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-slate-200"
            onClick={onClose}
            type="button"
          >
            <X size={16} />
          </button>
        )}

        <div className="px-8 pb-8 pt-10">
          {/* Header */}
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl border border-sky-500/30 bg-sky-950/50 shadow-[0_12px_24px_rgba(14,116,144,0.2)]">
              <Github size={28} className="text-sky-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">Sign in with GitHub</h2>
              <p className="mt-1 text-sm text-slate-400">
                Use a Personal Access Token to connect BrixCI to your account
              </p>
            </div>
          </div>

          {/* Steps */}
          <ol className="mb-6 space-y-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            <li className="flex items-start gap-3">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-sky-900/60 text-[11px] font-bold text-sky-300">1</span>
              <span className="text-xs leading-5 text-slate-300">
                Go to{' '}
                <a
                  className="inline-flex items-center gap-0.5 text-sky-400 underline-offset-2 hover:underline"
                  href="https://github.com/settings/tokens/new?scopes=repo,workflow&description=BrixCI"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  GitHub Settings → Personal Access Tokens
                  <ExternalLink size={11} />
                </a>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-sky-900/60 text-[11px] font-bold text-sky-300">2</span>
              <span className="text-xs leading-5 text-slate-300">
                Click <b className="text-slate-100">"Generate new token (classic)"</b>, enable{' '}
                <code className="rounded bg-slate-800 px-1 py-0.5 text-[10px] text-emerald-300">repo</code>{' '}
                and{' '}
                <code className="rounded bg-slate-800 px-1 py-0.5 text-[10px] text-emerald-300">workflow</code>{' '}
                scopes
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-sky-900/60 text-[11px] font-bold text-sky-300">3</span>
              <span className="text-xs leading-5 text-slate-300">
                Copy the generated token and paste it below
              </span>
            </li>
          </ol>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="relative">
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <Key size={15} />
              </div>
              <input
                ref={inputRef}
                aria-label="GitHub Personal Access Token"
                autoComplete="off"
                className="w-full rounded-xl border border-slate-700 bg-slate-900/70 py-3 pl-9 pr-10 text-sm text-slate-100 placeholder-slate-600 outline-none ring-0 transition focus:border-sky-500/70 focus:ring-1 focus:ring-sky-500/40"
                id="github-token-input"
                onChange={(e) => {
                  setTokenInput(e.currentTarget.value)
                  if (error) clearError()
                }}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                type={showToken ? 'text' : 'password'}
                value={tokenInput}
              />
              <button
                aria-label={showToken ? 'Hide token' : 'Show token'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
                onClick={() => setShowToken((v) => !v)}
                tabIndex={-1}
                type="button"
              >
                {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {error && (
              <p className="rounded-lg border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-xs text-rose-300">
                {error}
              </p>
            )}

            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-sky-500/50 bg-gradient-to-br from-sky-900 to-sky-800/80 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(14,116,144,0.25)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading || !tokenInput.trim()}
              id="github-login-btn"
              type="submit"
            >
              {isLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Verifying…
                </>
              ) : (
                <>
                  <Github size={15} />
                  Connect GitHub Account
                </>
              )}
            </button>
          </form>

          {/* Security note */}
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-950/20 px-3 py-2.5">
            <ShieldCheck size={14} className="mt-0.5 shrink-0 text-emerald-400" />
            <p className="text-[11px] leading-relaxed text-emerald-200/70">
              Your token is stored only in this browser's localStorage and is never sent to any server other than{' '}
              <strong className="text-emerald-300">api.github.com</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
