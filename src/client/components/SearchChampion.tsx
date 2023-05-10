/* eslint-disable functional/no-expression-statements,
                  functional/no-return-void */
import { predicate, string } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import type React from 'react'
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'

import { StringUtils } from '../../shared/utils/StringUtils'
import { Maybe } from '../../shared/utils/fp'

import { CloseFilled } from '../imgs/svgIcons'
import { cssClasses } from '../utils/cssClasses'

const { plural } = StringUtils

export type SearchChampionRef = {
  setSearch: React.Dispatch<React.SetStateAction<string>>
}

type Props = {
  searchCount: number
  initialSearch: Maybe<string>
  onChange: (search: Maybe<string>) => void
  className?: string
}

export const SearchChampion = forwardRef<SearchChampionRef, Props>(
  ({ searchCount, initialSearch, onChange, className }, ref) => {
    const searchRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
      const onKeyup = (e: KeyboardEvent): void => {
        if (
          ((e.key.toLowerCase() === 'f' && (e.ctrlKey || e.metaKey)) ||
            e.key === '/' ||
            e.key === 'F3') &&
          searchRef.current !== null
        ) {
          e.preventDefault()
          searchRef.current.focus()
        }
      }

      document.addEventListener('keydown', onKeyup, true)
      return () => document.removeEventListener('keydown', onKeyup, true)
    }, [])

    const [search, setSearch] = useState(
      pipe(
        initialSearch,
        Maybe.getOrElse(() => ''),
      ),
    )

    useImperativeHandle(ref, () => ({ setSearch }), [])

    const emptySearch = useCallback(() => {
      setSearch('')
      searchRef.current?.focus()
    }, [])

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearch('')
        searchRef.current?.blur()
      }
    }, [])

    const updateSearch = useMemo(
      (): ((search_: string) => void) =>
        flow(string.trim, Maybe.fromPredicate(predicate.not(string.isEmpty)), onChange),
      [onChange],
    )

    useEffect(() => {
      updateSearch(search)
    }, [updateSearch, search])

    const handleSearchChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value),
      [],
    )

    const onFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => e.target.select(), [])

    return (
      <div className={cssClasses('relative flex flex-col items-center text-xs', className)}>
        <div className="flex items-center">
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            onFocus={onFocus}
            placeholder="Rechercher champion"
            className={cssClasses(
              'w-[151px] justify-self-start rounded-sm border border-zinc-700 bg-transparent py-1 pl-2',
              search === '' ? 'pr-2' : 'pr-7',
            )}
          />
          {search !== '' ? (
            <button type="button" onClick={emptySearch} className="-ml-6">
              <CloseFilled className="h-5 fill-wheat" />
            </button>
          ) : null}
        </div>
        <span
          className={cssClasses('absolute top-full pt-0.5 text-zinc-400', [
            'hidden',
            Maybe.isNone(initialSearch),
          ])}
        >
          {plural('résultat')(searchCount)}
        </span>
      </div>
    )
  },
)
