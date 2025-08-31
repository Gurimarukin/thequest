/* eslint-disable functional/no-expression-statements,
                  functional/no-return-void */
import { io, predicate, string } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Maybe } from '../../shared/utils/fp'

import { useTranslation } from '../contexts/TranslationContext'
import { CloseFilled, DiceFilled } from '../imgs/svgs/icons'
import { cx } from '../utils/cx'
import { Tooltip } from './tooltip/Tooltip'

type Props = {
  searchCount: number
  randomChampion: Maybe<() => string>
  initialSearch: Maybe<string>
  onChange: (search: Maybe<string>) => void
  className?: string
}

export const SearchChampion: React.FC<Props> = ({
  searchCount,
  randomChampion,
  initialSearch,
  onChange,
  className,
}) => {
  const { t } = useTranslation('common')

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
        searchRef.current.select()
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

  const handleRandomClick = useMemo(
    (): (() => void) | undefined =>
      pipe(randomChampion, Maybe.map(io.map(setSearch)), Maybe.toUndefined),
    [randomChampion],
  )

  const randomButtonRef = useRef<HTMLButtonElement>(null)

  return (
    <div className={cx('flex flex-wrap items-center gap-3', className)}>
      <div className="relative flex flex-col items-center text-xs">
        <div className="grid items-center">
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            onFocus={onFocus}
            placeholder={t.searchChamion}
            className={cx(
              'w-[130px] justify-self-start rounded-sm border border-grey-disabled bg-transparent py-0.5 pl-2 area-1',
              search === '' ? 'pr-2' : 'pr-7',
            )}
          />
          {search !== '' ? (
            <button type="button" onClick={emptySearch} className="mr-1 justify-self-end area-1">
              <CloseFilled className="h-5 text-wheat" />
            </button>
          ) : null}
        </div>
        <span
          className={cx('absolute top-full pt-0.5 text-zinc-400', {
            hidden: Maybe.isNone(initialSearch),
          })}
        >
          {t.nResults(searchCount)}
        </span>
      </div>

      <button
        ref={randomButtonRef}
        type="button"
        onClick={handleRandomClick}
        disabled={Maybe.isNone(randomChampion)}
        className="group -mx-0.5 overflow-hidden p-0.5 disabled:opacity-30"
      >
        <DiceFilled className="h-7 transition-transform duration-300 group-enabled:group-hover:animate-dice" />
      </button>
      <Tooltip hoverRef={randomButtonRef} placement="top">
        {t.randomChampion}
      </Tooltip>
    </div>
  )
}
