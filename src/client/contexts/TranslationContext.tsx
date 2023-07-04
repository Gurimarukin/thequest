import { task } from 'fp-ts'
import type { Task } from 'fp-ts/Task'
import { pipe } from 'fp-ts/function'
import { createContext, useContext } from 'react'
import useSWR from 'swr'

import { Lang } from '../../shared/models/api/Lang'
import type { Dict } from '../../shared/utils/fp'

import { Loading } from '../components/Loading'
import { useLocalStorageState } from '../hooks/useLocalStorageState'
import type { ChildrenFC } from '../models/ChildrenFC'
import type { Translation } from '../models/Translation'

const translations: Dict<Lang, Task<Translation>> = {
  en_GB: tDefault(() => import('../locales/frFR')),
  fr_FR: tDefault(() => import('../locales/frFR')),
}

const languageKey = 'language'

export type TranslationContext<K extends null | keyof Translation = null> =
  K extends keyof Translation
    ? GenericTranslationContext<Translation[K]>
    : GenericTranslationContext<Translation>

type GenericTranslationContext<A> = {
  lang: Lang
  setLang: React.Dispatch<React.SetStateAction<Lang>>
  t: A
}

const TranslationContext = createContext<TranslationContext | undefined>(undefined)

export const TranslationContextProvider: ChildrenFC = ({ children }) => {
  const [lang, setLang] = useLocalStorageState(
    languageKey,
    [Lang.codec, 'Lang'],
    Lang.fromNavigatorLanguage(window.navigator.language),
  )

  const { data, error } = useSWR([lang], ([lang_]) => translations[lang_]())

  if (error !== undefined) {
    return (
      <div className="flex justify-center">
        <pre className="mt-4">error.</pre>
      </div>
    )
  }

  if (data === undefined) {
    return (
      <div className="flex justify-center">
        <Loading className="mt-4 h-6" />
      </div>
    )
  }

  const value: TranslationContext = {
    lang,
    setLang,
    t: data,
  }

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>
}

export function useTranslation(): TranslationContext
export function useTranslation<K extends keyof Translation>(key: K): TranslationContext<K>
export function useTranslation<K extends keyof Translation>(key?: K): TranslationContext<K> {
  const context = useContext(TranslationContext)
  if (context === undefined) {
    // eslint-disable-next-line functional/no-throw-statements
    throw Error('useTranslation must be used within a TranslationContextProvider')
  }
  if (key === undefined) return context as TranslationContext<K>
  const { t, ...context_ } = context
  return { ...context_, t: t[key] } as TranslationContext<K>
}

function tDefault<A>(fa: Task<{ default: A }>): Task<A> {
  return pipe(
    fa,
    task.map(t => t.default),
  )
}
