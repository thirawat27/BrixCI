import { createContext } from 'react'
import type { ValidationIssue } from '../domain/graph'
import type { UiDictionary, UiLanguage } from './catalog'

export interface I18nContextState {
  language: UiLanguage
  setLanguage: (language: UiLanguage) => void
  text: UiDictionary
  issueMessage: (issue: ValidationIssue) => string
}

export const I18nContext = createContext<I18nContextState | null>(null)
