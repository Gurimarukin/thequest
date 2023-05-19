/* eslint-disable functional/no-expression-statements,
                  functional/no-return-void */
import { task } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { useCallback, useEffect, useState } from 'react'

import { Platform } from '../../../shared/models/api/Platform'
import { Puuid } from '../../../shared/models/api/summoner/Puuid'
import type { SummonerShort } from '../../../shared/models/api/summoner/SummonerShort'
import { Future, List, Maybe, NonEmptyArray } from '../../../shared/utils/fp'

import { useHistory } from '../../contexts/HistoryContext'
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
import { Link } from '../Link'
import { Loading } from '../Loading'
import { Select } from '../Select'

export const SearchSummoner: React.FC = () => {
  const { navigate, matchesLocation, masteriesQuery } = useHistory()
  const { maybeUser, recentSearches } = useUser()

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

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      navigate(
        appRoutes.platformSummonerName(
          platform,
          summonerName,
          matchesLocation(appParsers.platformSummonerName)
            ? MasteriesQuery.toPartial({ ...masteriesQuery, search: Maybe.none })
            : {},
        ),
      )
    },
    [masteriesQuery, matchesLocation, navigate, platform, summonerName],
  )

  const searches: List<React.JSX.Element> = List.compact([
    pipe(
      maybeUser,
      Maybe.chain(u => u.linkedRiotAccount),
      // eslint-disable-next-line react/jsx-key
      Maybe.map(s => <SummonerSearch type="self" summoner={s} />),
    ),
    pipe(
      maybeUser,
      Maybe.chain(u => NonEmptyArray.fromReadonlyArray(u.favoriteSearches)),
      Maybe.map(favoriteSearches => (
        <>
          {favoriteSearches.map(s => (
            <SummonerSearch key={Puuid.unwrap(s.puuid)} type="favorite" summoner={s} />
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
            <SummonerSearch key={Puuid.unwrap(s.puuid)} type="recent" summoner={s} />
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
              'absolute top-full z-40 max-h-[calc(100vh_-_5rem)] items-center gap-y-3 overflow-auto border border-goldenrod bg-zinc-900 py-2',
              Maybe.isSome(maybeUser) ? 'grid-cols-[auto_auto_auto]' : 'grid-cols-[auto_auto] pr-3',
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

const concatWithHr = (es: List<React.JSX.Element>): React.JSX.Element | null =>
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
}

const SummonerSearch: React.FC<SummonerSearchProps> = ({ type, summoner }) => {
  const { navigate, matchesLocation, masteriesQuery } = useHistory()
  const { maybeUser, addFavoriteSearch, removeFavoriteSearch, removeRecentSearch } = useUser()
  const staticData = useStaticData()

  // with current masteriesQuery
  const sPlatformPuuid = useCallback(
    (platform: Platform, puuid: Puuid): string =>
      appRoutes.sPlatformPuuid(
        platform,
        puuid,
        matchesLocation(appParsers.platformSummonerName)
          ? MasteriesQuery.toPartial({ ...masteriesQuery, search: Maybe.none })
          : {},
      ),
    [masteriesQuery, matchesLocation],
  )

  const removeRecent = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      removeRecentSearch(summoner)
    },
    [removeRecentSearch, summoner],
  )

  const [favoriteIsLoading, setFavoriteIsLoading] = useState(false)

  const addFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setFavoriteIsLoading(true)
      return pipe(
        addFavoriteSearch(summoner),
        // on not found
        Future.map(
          Maybe.getOrElseW(() => navigate(sPlatformPuuid(summoner.platform, summoner.puuid))),
        ),
        task.chainFirstIOK(() => () => setFavoriteIsLoading(false)),
        futureRunUnsafe,
      )
    },
    [addFavoriteSearch, navigate, sPlatformPuuid, summoner],
  )

  const removeFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setFavoriteIsLoading(true)
      return pipe(
        removeFavoriteSearch(summoner),
        task.chainFirstIOK(() => () => setFavoriteIsLoading(false)),
        futureRunUnsafe,
      )
    },
    [removeFavoriteSearch, summoner],
  )

  return (
    <li className="contents">
      {renderRecent(type, removeRecent)}
      <Link
        to={sPlatformPuuid(summoner.platform, summoner.puuid)}
        className="flex items-center hover:underline"
      >
        <img
          src={staticData.assets.summonerIcon(summoner.profileIconId)}
          alt={`Icône de ${summoner.name}`}
          className="w-12"
        />
        <span className="ml-2 grow">{summoner.name}</span>
        <span className="ml-4">{summoner.platform}</span>
      </Link>
      {Maybe.isSome(maybeUser)
        ? renderFavorite(type, favoriteIsLoading, addFavorite, removeFavorite)
        : null}
    </li>
  )
}

const renderRecent = (
  type: SummonerSearchProps['type'],
  removeRecent: (e: React.MouseEvent) => void,
): React.JSX.Element => {
  switch (type) {
    case 'self':
      return <span className="w-3" />

    case 'favorite':
      return <span className="w-3" />

    case 'recent':
      return (
        <button type="button" onClick={removeRecent} className="group p-2">
          <TimeOutline className="h-4 text-goldenrod group-hover:hidden" />
          <CloseFilled className="hidden h-4 text-red group-hover:flex" />
        </button>
      )
  }
}

const renderFavorite = (
  type: SummonerSearchProps['type'],
  isLoading: boolean,
  addFavorite: (e: React.MouseEvent) => void,
  removeFavorite: (e: React.MouseEvent) => void,
): React.JSX.Element => {
  switch (type) {
    case 'self':
      return (
        <span className="px-3">
          <PersonFilled className="h-4 text-goldenrod" />
        </span>
      )

    case 'favorite':
      return (
        <button
          type="button"
          onClick={removeFavorite}
          disabled={isLoading}
          className="px-3 pb-3 pt-2 text-goldenrod enabled:hover:text-red"
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
          className="px-3 pb-3 pt-2 text-goldenrod enabled:hover:text-wheat"
        >
          {isLoading ? <Loading className="h-5" /> : <StarOutline className="h-5" />}
        </button>
      )
  }
}

const Hr: React.FC = () => (
  <>
    <div className="w-[calc(100%_-_1rem)] justify-self-end border-t border-goldenrod" />
    <div className="border-t border-goldenrod" />
    <div className="w-[calc(100%_-_1rem)] border-t border-goldenrod" />
  </>
)
