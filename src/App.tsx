import { Suspense, lazy } from 'react'
import { LanguageProvider } from './i18n'

const BrixEditorPage = lazy(async () => {
  const module = await import('./features/editor/BrixEditorPage')
  return { default: module.BrixEditorPage }
})

function App() {
  return (
    <LanguageProvider>
      <Suspense
        fallback={
          <main className="grid min-h-screen place-content-center gap-3 px-6 text-center text-slate-100">
            <img
              alt="BrixCI logo"
              className="mx-auto size-20 rounded-3xl border border-sky-400/20 bg-sky-500/10 p-3 shadow-[0_18px_36px_rgba(14,116,144,0.15)]"
              height={80}
              src="/BrixCI.png"
              width={80}
            />
            <h1 className="text-xl font-semibold">BrixCI</h1>
            <p className="text-sm text-slate-300">Loading editor...</p>
          </main>
        }
      >
        <BrixEditorPage />
      </Suspense>
    </LanguageProvider>
  )
}

export default App
