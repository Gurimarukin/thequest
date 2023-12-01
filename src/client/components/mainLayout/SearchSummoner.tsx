/* eslint-disable functional/no-expression-statements,
                  functional/no-return-void */
import { task } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { useCallback, useEffect, useState } from 'react'

import { Platform } from '../../../shared/models/api/Platform'
import { Puuid } from '../../../shared/models/api/summoner/Puuid'
import { GameName } from '../../../shared/models/riot/GameName'
import { RiotId } from '../../../shared/models/riot/RiotId'
import { SummonerName } from '../../../shared/models/riot/SummonerName'
import { TagLine } from '../../../shared/models/riot/TagLine'
import { Future, List, Maybe, NonEmptyArray } from '../../../shared/utils/fp'

import { useHistory } from '../../contexts/HistoryContext'
import { useStaticData } from '../../contexts/StaticDataContext'
import { useTranslation } from '../../contexts/TranslationContext'
import { useUser } from '../../contexts/UserContext'
import { usePlatformSummonerNameFromLocation } from '../../hooks/usePlatformSummonerNameFromLocation'
import {
  CloseFilled,
  PersonFilled,
  SearchOutline,
  StarFilled,
  StarOutline,
  TimeOutline,
} from '../../imgs/svgs/icons'
import { PartialSummonerShort } from '../../models/PartialSummonerShort'
import { MasteriesQuery } from '../../models/masteriesQuery/MasteriesQuery'
import { appParsers, appRoutes } from '../../router/AppRouter'
import { cx } from '../../utils/cx'
import { futureRunUnsafe } from '../../utils/futureRunUnsafe'
import { ClickOutside } from '../ClickOutside'
import { Link } from '../Link'
import { Loading } from '../Loading'
import { Select } from '../Select'

export const SearchSummoner: React.FC = () => {
  const { navigate, matchLocation, masteriesQuery } = useHistory()
  const { maybeUser, recentSearches } = useUser()
  const { t } = useTranslation('common')

  const [isOpen, setIsOpen] = useState(false)
  const close = useCallback(() => setIsOpen(false), [])

  const platformSummonerNameFromLocation = usePlatformSummonerNameFromLocation()

  const [platform, setPlatform] = useState<Platform>(
    platformSummonerNameFromLocation?.platform ?? Platform.defaultPlatform,
  )

  const summonerNameFromLocation = platformSummonerNameFromLocation?.summonerName
  const [summonerName, setSummonerName] = useState(
    summonerNameFromLocation !== undefined ? SummonerName.unwrap(summonerNameFromLocation) : '',
  )

  useEffect(() => {
    if (summonerNameFromLocation !== undefined) {
      setSummonerName(SummonerName.unwrap(summonerNameFromLocation))
    }
  }, [summonerNameFromLocation])

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
        (Maybe.isSome(matchLocation(appParsers.platformSummonerNameGame))
          ? appRoutes.platformSummonerNameGame
          : appRoutes.platformSummonerName)(
          platform,
          SummonerName.wrap(summonerName),
          Maybe.isSome(matchLocation(appParsers.platformSummonerName))
            ? MasteriesQuery.toPartial({ ...masteriesQuery, search: Maybe.none })
            : {},
        ),
      )
    },
    [masteriesQuery, matchLocation, navigate, platform, summonerName],
  )

  const searches: List<React.ReactElement> = List.compact([
    pipe(
      maybeUser,
      Maybe.chain(u => u.linkedRiotAccount),
      Maybe.map(s => (
        // eslint-disable-next-line react/jsx-key
        <SummonerSearch type="self" summoner={PartialSummonerShort.fromSummonerShort(s)} />
      )),
    ),
    pipe(
      maybeUser,
      Maybe.chain(u => NonEmptyArray.fromReadonlyArray(u.favoriteSearches)),
      Maybe.map(favoriteSearches => (
        <>
          {favoriteSearches.map(s => (
            <SummonerSearch
              key={Puuid.unwrap(s.puuid)}
              type="favorite"
              summoner={PartialSummonerShort.fromSummonerShort(s)}
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
            <SummonerSearch key={Puuid.unwrap(s.puuid)} type="recent" summoner={s} />
          ))}
        </>
      )),
    ),
  ])

  const showSearches = isOpen && List.isNonEmpty(searches)

  return (
    <form onSubmit={handleSubmit} className="flex h-8 font-medium">
      <Select<Platform>
        options={Platform.values}
        value={platform}
        setValue={setPlatform}
        className="border-y border-l border-goldenrod bg-black pl-1"
      />
      <div className="grid">
        <ClickOutside onClickOutside={close}>
          <input
            type="text"
            value={summonerName}
            onChange={handleChange}
            onFocus={handleFocus}
            placeholder={t.layout.searchSummoner}
            className={cx('w-60 border border-goldenrod bg-black pl-2 pr-8 area-1', [
              'font-normal',
              summonerName === '',
            ])}
          />
          <ul
            className={cx(
              'absolute top-full z-40 max-h-[calc(100vh_-_5rem)] min-w-[336px] items-center gap-y-3 overflow-auto border border-goldenrod bg-zinc-900 py-2',
              Maybe.isSome(maybeUser) ? 'grid-cols-[auto_auto_auto]' : 'grid-cols-[auto_auto] pr-3',
              showSearches ? 'grid' : 'hidden',
            )}
          >
            {concatWithHr(searches)}
          </ul>
        </ClickOutside>
        <button type="submit" className="mr-1 justify-self-end area-1">
          <SearchOutline className="h-6 text-goldenrod" />
        </button>
      </div>
    </form>
  )
}

const concatWithHr = (es: List<React.ReactElement>): React.ReactElement | null =>
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
  summoner: PartialSummonerShort
}

const SummonerSearch: React.FC<SummonerSearchProps> = ({ type, summoner }) => {
  const { navigate, matchLocation, masteriesQuery } = useHistory()
  const { maybeUser, addFavoriteSearch, removeFavoriteSearch, removeRecentSearch } = useUser()
  const { t } = useTranslation('common')
  const staticData = useStaticData()

  // with current masteriesQuery
  const puuidRoute = useCallback(
    (platform: Platform, puuid: Puuid): string =>
      (Maybe.isSome(matchLocation(appParsers.platformSummonerNameGame))
        ? appRoutes.sPlatformPuuidGame
        : appRoutes.sPlatformPuuid)(
        platform,
        puuid,
        Maybe.isSome(matchLocation(appParsers.platformSummonerName))
          ? MasteriesQuery.toPartial({ ...masteriesQuery, search: Maybe.none })
          : {},
      ),
    [masteriesQuery, matchLocation],
  )

  const removeRecent = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      removeRecentSearch(summoner.puuid)
    },
    [removeRecentSearch, summoner],
  )

  const [favoriteIsLoading, setFavoriteIsLoading] = useState(false)

  const addFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()

      if (Maybe.isNone(summoner.riotId)) {
        return navigateToSummoner()
      }

      setFavoriteIsLoading(true)
      return pipe(
        addFavoriteSearch({ ...summoner, riotId: summoner.riotId.value }),
        // on not found
        Future.map(Maybe.getOrElseW(() => navigateToSummoner())),
        task.chainFirstIOK(() => () => setFavoriteIsLoading(false)),
        futureRunUnsafe,
      )

      function navigateToSummoner(): void {
        return navigate(puuidRoute(summoner.platform, summoner.puuid))
      }
    },
    [addFavoriteSearch, navigate, puuidRoute, summoner],
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
        to={puuidRoute(summoner.platform, summoner.puuid)}
        className="group flex items-center leading-4"
      >
        <img
          src={staticData.assets.summonerIcon(summoner.profileIconId)}
          alt={t.summonerIconAlt(
            pipe(
              summoner.riotId,
              Maybe.fold(() => SummonerName.unwrap(summoner.name), RiotId.stringify),
            ),
          )}
          className="w-12"
        />
        <div className="ml-2 flex grow items-baseline gap-0.5">
          {pipe(
            summoner.riotId,
            Maybe.fold(
              () => <span className={linkClassName}>{SummonerName.unwrap(summoner.name)}</span>,
              riotId => (
                <>
                  <span className={cx(linkClassName, 'text-goldenrod')}>
                    {GameName.unwrap(riotId.gameName)}
                  </span>
                  <span className="font-normal text-grey-500">
                    #{TagLine.unwrap(riotId.tagLine)}
                  </span>
                </>
              ),
            ),
          )}
        </div>
        <span className={cx(linkClassName, 'ml-4 font-normal')}>{summoner.platform}</span>
      </Link>
      {Maybe.isSome(maybeUser)
        ? renderFavorite(type, favoriteIsLoading, addFavorite, removeFavorite)
        : null}
    </li>
  )
}

const linkClassName = 'border-y border-y-transparent group-hover:border-b-current'

const renderRecent = (
  type: SummonerSearchProps['type'],
  removeRecent: (e: React.MouseEvent) => void,
): React.ReactElement => {
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
): React.ReactElement => {
  switch (type) {
    case 'self':
      return (
        <span className="px-3">
          <PersonFilled className="h-4" />
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
