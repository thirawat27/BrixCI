import { useEffect, useRef, useState } from 'react'
import { LogOut, Github, ExternalLink, ChevronDown } from 'lucide-react'
import { type GitHubUser } from '../../store/authStore'

interface UserMenuProps {
  user: GitHubUser
  onLogout: () => void
}

export function UserMenu({ user, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('pointerdown', handler)
    window.addEventListener('keydown', key)
    return () => {
      window.removeEventListener('pointerdown', handler)
      window.removeEventListener('keydown', key)
    }
  }, [open])

  return (
    <div className="relative" ref={menuRef}>
      <button
        aria-expanded={open}
        aria-label="Account menu"
        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/85 pl-1 pr-3 py-1 text-xs font-semibold text-slate-100 shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition hover:border-slate-500 hover:-translate-y-px"
        id="user-menu-btn"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <img
          alt={user.login}
          className="size-7 rounded-lg object-cover"
          src={user.avatar_url}
        />
        <span className="max-w-[80px] truncate">{user.login}</span>
        <ChevronDown className={`transition ${open ? 'rotate-180' : ''}`} size={12} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-slate-800 bg-slate-950/96 p-2 shadow-[0_24px_48px_rgba(0,0,0,0.5)] backdrop-blur-xl"
          role="menu"
        >
          {/* Profile header */}
          <div className="mb-2 flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/50 px-3 py-2.5">
            <img
              alt={user.login}
              className="size-10 rounded-xl object-cover ring-1 ring-slate-700"
              src={user.avatar_url}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-100">
                {user.name || user.login}
              </p>
              <p className="truncate text-xs text-slate-400">@{user.login}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-2 grid grid-cols-2 gap-1.5 px-1">
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 px-2 py-1.5 text-center">
              <p className="text-sm font-bold text-slate-100">{user.public_repos}</p>
              <p className="text-[10px] text-slate-500">Repos</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 px-2 py-1.5 text-center">
              <p className="text-sm font-bold text-slate-100">{user.followers}</p>
              <p className="text-[10px] text-slate-500">Followers</p>
            </div>
          </div>

          {/* Actions */}
          <a
            className="flex w-full items-center gap-2 rounded-xl border border-slate-800 px-3 py-2 text-left text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-slate-100"
            href={user.html_url}
            rel="noopener noreferrer"
            role="menuitem"
            target="_blank"
          >
            <Github size={13} />
            View GitHub Profile
            <ExternalLink size={11} className="ml-auto text-slate-600" />
          </a>

          <button
            className="mt-1 flex w-full items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-950/20 px-3 py-2 text-left text-xs font-semibold text-rose-300 transition hover:brightness-110"
            id="logout-btn"
            onClick={() => { onLogout(); setOpen(false) }}
            role="menuitem"
            type="button"
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
