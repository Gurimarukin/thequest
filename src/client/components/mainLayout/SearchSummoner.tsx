/* eslint-disable functional/no-expression-statements,
                  functional/no-return-void */
import type { Parser } from 'fp-ts-routing'
import { pipe } from 'fp-ts/function'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { Platform } from '../../../shared/models/api/Platform'
import type { SummonerShort } from '../../../shared/models/api/summoner/SummonerShort'
import { Future, List, Maybe, NonEmptyArray } from '../../../shared/utils/fp'

import { apiSummonerByPuuidGet } from '../../api'
import { HistoryState, useHistory } from '../../contexts/HistoryContext'
import { useStaticData } from '../../contexts/StaticDataContext'
import { useUser } from '../../contexts/UserContext'
import { useSummonerNameFromLocation } from '../../hooks/useSummonerNameFromLocation'
import {
  CloseFilled,
  PersonFilled,
  SearchOutline,
  StarFilled,
  StarOutline,
  TimeOutline,
} from '../../imgs/svgIcons'
import { MasteriesQuery } from '../../models/masteriesQuery/MasteriesQuery'
import { appParsers, appRoutes } from '../../router/AppRouter'
import { cssClasses } from '../../utils/cssClasses'
import { futureRunUnsafe } from '../../utils/futureRunUnsafe'
import { ClickOutside } from '../ClickOutside'
import { Loading } from '../Loading'
import { Select } from '../Select'

export const SearchSummoner = (): JSX.Element => {
  const { navigate, matchesLocation, masteriesQuery } = useHistory()
  const { user, recentSearches } = useUser()

  const [isOpen, setIsOpen] = useState(false)
  const close = useCallback(() => setIsOpen(false), [])

  const summonerNameFromLocation = useSummonerNameFromLocation()

  const [summonerName, setSummonerName] = useState(
    pipe(
      summonerNameFromLocation,
      Maybe.getOrElse(() => ''),
    ),
  )

  useEffect(() => {
    pipe(summonerNameFromLocation, Maybe.map(setSummonerName))
  }, [summonerNameFromLocation])

  const [platform, setPlatform] = useState<Platform>(Platform.defaultPlatform)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setSummonerName(e.target.value),
    [],
  )

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select()
    setIsOpen(true)
  }, [])

  // with current masteriesQuery
  const platformSummonerName = useMemo(
    () => getPlatformSummonerName(matchesLocation, masteriesQuery),
    [masteriesQuery, matchesLocation],
  )

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      navigate(platformSummonerName(platform, summonerName))
    },
    [navigate, platform, platformSummonerName, summonerName],
  )

  const searches: List<JSX.Element> = List.compact([
    pipe(
      user,
      Maybe.chain(u => u.linkedRiotAccount),
      // eslint-disable-next-line react/jsx-key
      Maybe.map(s => <SummonerSearch type="self" summoner={s} closeSearch={close} />),
    ),
    pipe(
      user,
      Maybe.chain(u => NonEmptyArray.fromReadonlyArray(u.favoriteSearches)),
      Maybe.map(favoriteSearches => (
        <>
          {favoriteSearches.map(s => (
            <SummonerSearch
              key={`${s.platform}${s.name}`}
              type="favorite"
              summoner={s}
              closeSearch={close}
            />
          ))}
        </>
      )),
    ),
    pipe(
      recentSearches,
      NonEmptyArray.fromReadonlyArray,
      Maybe.map(recentSearches_ => (
        <>
          {recentSearches_.map(s => (
            <SummonerSearch
              key={`${s.platform}${s.name}`}
              type="recent"
              summoner={s}
              closeSearch={close}
            />
          ))}
        </>
      )),
    ),
  ])

  const showSearches = isOpen && List.isNonEmpty(searches)

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex h-8 text-sm">
        <Select<Platform>
          options={Platform.values}
          value={platform}
          setValue={setPlatform}
          className="border-y border-l border-goldenrod bg-black pl-1"
        />
        <ClickOutside onClickOutside={close}>
          <input
            type="text"
            value={summonerName}
            onChange={handleChange}
            onFocus={handleFocus}
            placeholder="Rechercher invocateur"
            className="w-52 border border-goldenrod bg-black pl-2 pr-8"
          />
          <ul
            className={cssClasses(
              'absolute top-full z-40 max-h-[calc(100vh_-_5rem)] grid-cols-[auto_auto_auto] items-center gap-y-3 overflow-auto border border-goldenrod bg-zinc-900 py-2',
              showSearches ? 'grid' : 'hidden',
            )}
          >
            {concatWithHr(searches)}
          </ul>
        </ClickOutside>
        <button type="submit" className="-ml-7">
          <SearchOutline className="h-6 text-goldenrod" />
        </button>
      </form>
    </div>
  )
}

const concatWithHr = (es: List<JSX.Element>): JSX.Element | null =>
  pipe(
    es,
    NonEmptyArray.fromReadonlyArray,
    Maybe.fold(
      () => null,
      NonEmptyArray.concatAll({
        concat: (x, y) => (
          <>
            {x}
            <Hr />
            {y}
          </>
        ),
      }),
    ),
  )

type SummonerSearchProps = {
  type: 'self' | 'favorite' | 'recent'
  summoner: SummonerShort
  closeSearch: () => void
}

const SummonerSearch = ({ type, summoner, closeSearch }: SummonerSearchProps): JSX.Element => {
  const {
    modifyHistoryStateRef: setHistoryState,
    navigate,
    matchesLocation,
    masteriesQuery,
  } = useHistory()
  const { addFavoriteSearch, removeFavoriteSearch, removeRecentSearch } = useUser()
  const staticData = useStaticData()

  // with current masteriesQuery
  const platformSummonerName = useMemo(
    () => getPlatformSummonerName(matchesLocation, masteriesQuery),
    [masteriesQuery, matchesLocation],
  )

  const navigateToSummonerByPuuid = useCallback(() => {
    pipe(
      apiSummonerByPuuidGet(summoner.platform, summoner.puuid),
      Maybe.some,
      HistoryState.Lens.futureSummonerMasteries.set,
      setHistoryState,
    )
    closeSearch()
    navigate(platformSummonerName(summoner.platform, summoner.name), {
      replace: true,
    })
  }, [
    closeSearch,
    navigate,
    platformSummonerName,
    setHistoryState,
    summoner.name,
    summoner.platform,
    summoner.puuid,
  ])

  const removeRecent = useCallback(
    () => removeRecentSearch(summoner),
    [removeRecentSearch, summoner],
  )

  const [favoriteIsLoading, setFavoriteIsLoading] = useState(false)

  const addFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setFavoriteIsLoading(true)
      pipe(
        // error is already handled in UserContext
        addFavoriteSearch(summoner),
        // on not found
        Future.map(
          Maybe.fold(
            () => navigateToSummonerByPuuid(),
            () => setFavoriteIsLoading(false),
          ),
        ),
        futureRunUnsafe,
      )
    },
    [addFavoriteSearch, navigateToSummonerByPuuid, summoner],
  )

  const removeFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setFavoriteIsLoading(true)
      pipe(
        // error is already handled in UserContext
        removeFavoriteSearch(summoner),
        Future.map(() => setFavoriteIsLoading(false)),
        futureRunUnsafe,
      )
    },
    [removeFavoriteSearch, summoner],
  )

  return (
    <li className="contents">
      {renderRecent(type, removeRecent)}
      <button
        type="button"
        onClick={navigateToSummonerByPuuid}
        className="flex items-center hover:underline"
      >
        <img
          src={staticData.assets.summonerIcon(summoner.profileIconId)}
          alt={`Icône de ${summoner.name}`}
          className="w-12"
        />
        <span className="ml-2 grow">{summoner.name}</span>
        <span className="ml-4">{summoner.platform}</span>
      </button>
      {renderFavorite(type, favoriteIsLoading, addFavorite, removeFavorite)}
    </li>
  )
}

const renderRecent = (type: SummonerSearchProps['type'], removeRecent: () => void): JSX.Element => {
  switch (type) {
    case 'self':
      return <span className="w-3" />

    case 'favorite':
      return <span className="w-3" />

    case 'recent':
      return (
        <button type="button" onClick={removeRecent} className="group p-2">
          <TimeOutline className="h-4 text-goldenrod group-hover:hidden" />
          <CloseFilled className="hidden h-4 fill-red-700 group-hover:flex" />
        </button>
      )
  }
}

const renderFavorite = (
  type: SummonerSearchProps['type'],
  isLoading: boolean,
  addFavorite: (e: React.MouseEvent) => void,
  removeFavorite: (e: React.MouseEvent) => void,
): JSX.Element => {
  switch (type) {
    case 'self':
      return (
        <span className="px-3">
          <PersonFilled className="h-4 fill-goldenrod" />
        </span>
      )

    case 'favorite':
      return (
        <button
          type="button"
          onClick={removeFavorite}
          disabled={isLoading}
          className="fill-goldenrod px-3 pt-2 pb-3 enabled:hover:fill-red-700"
        >
          {isLoading ? <Loading className="h-5" /> : <StarFilled className="h-5" />}
        </button>
      )

    case 'recent':
      return (
        <button
          type="button"
          onClick={addFavorite}
          disabled={isLoading}
          className="px-3 pt-2 pb-3 text-goldenrod enabled:hover:text-wheat"
        >
          {isLoading ? <Loading className="h-5" /> : <StarOutline className="h-5" />}
        </button>
      )
  }
}

const Hr = (): JSX.Element => (
  <>
    <div className="w-[calc(100%_-_1rem)] justify-self-end border-t border-goldenrod" />
    <div className="border-t border-goldenrod" />
    <div className="w-[calc(100%_-_1rem)] border-t border-goldenrod" />
  </>
)

const getPlatformSummonerName =
  (matchesLocation: <A>(parser: Parser<A>) => boolean, query: MasteriesQuery) =>
  (platform: Platform, summonerName: string): string =>
    appRoutes.platformSummonerName(
      platform,
      summonerName,
      matchesLocation(appParsers.platformSummonerName) ? MasteriesQuery.toPartial(query) : {},
    )
