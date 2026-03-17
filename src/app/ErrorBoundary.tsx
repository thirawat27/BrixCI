import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message,
    }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Unhandled UI error:', error, errorInfo)
  }

  override render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <main className="grid min-h-screen place-content-center gap-3 px-6 text-center text-slate-100">
        <h1 className="text-2xl font-semibold">Unexpected UI Error</h1>
        <p className="text-sm text-slate-300">The editor encountered an unexpected problem.</p>
        {this.state.message && (
          <code className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-sans">
            {this.state.message}
          </code>
        )}
        <button
          className="mx-auto inline-flex items-center rounded-md border border-sky-500/70 bg-gradient-to-br from-sky-900 to-sky-700 px-3 py-2 text-sm font-semibold text-slate-100 hover:brightness-110"
          onClick={() => {
            window.location.reload()
          }}
          type="button"
        >
          Reload
        </button>
      </main>
    )
  }
}
