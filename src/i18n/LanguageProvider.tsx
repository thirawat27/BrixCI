import { useEffect, useState, type ReactNode } from 'react'
import { I18nContext } from './context'
import { ISSUE_DICTIONARY, UI_DICTIONARY, UI_LANGUAGES, type UiLanguage } from './catalog'

const STORAGE_KEY = 'brixci-ui-language'

function isUiLanguage(input: string | null): input is UiLanguage {
  return !!input && UI_LANGUAGES.includes(input as UiLanguage)
}

function getInitialLanguage(): UiLanguage {
  if (typeof window === 'undefined') {
    return 'en'
  }

  const stored = localStorage.getItem(STORAGE_KEY)
  if (isUiLanguage(stored)) {
    return stored
  }
  return 'en'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<UiLanguage>(getInitialLanguage)
  const text = UI_DICTIONARY[language]

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language)
  }, [language])

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        text,
        issueMessage: (issue) => ISSUE_DICTIONARY[language][issue.code] ?? issue.message,
      }}
    >
      {children}
    </I18nContext.Provider>
  )
}
