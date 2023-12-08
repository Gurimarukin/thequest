/* eslint-disable functional/no-expression-statements */
import { pipe } from 'fp-ts/function'
import { useCallback, useEffect, useState } from 'react'

import { Platform } from '../../../../shared/models/api/Platform'
import { Puuid } from '../../../../shared/models/api/summoner/Puuid'
import type { RiotId } from '../../../../shared/models/riot/RiotId'
import { SummonerName } from '../../../../shared/models/riot/SummonerName'
import { Either, List, Maybe, NonEmptyArray } from '../../../../shared/utils/fp'

import { useHistory } from '../../../contexts/HistoryContext'
import { useUser } from '../../../contexts/UserContext'
import { usePlatformWithRiotIdFromLocation } from '../../../hooks/usePlatformWithRiotIdFromLocation'
import { SearchOutline } from '../../../imgs/svgs/icons'
import { MasteriesQuery } from '../../../models/masteriesQuery/MasteriesQuery'
import { PartialSummonerShort } from '../../../models/summoner/PartialSummonerShort'
import { appParsers, appRoutes } from '../../../router/AppRouter'
import { cx } from '../../../utils/cx'
import { ClickOutside } from '../../ClickOutside'
import { Select } from '../../Select'
import { SearchSummonerInput } from './SearchSummonerInput'
import { SummonerSearch } from './SummonerSearch'

export const SearchSummoner: React.FC = () => {
  const { navigate, matchLocation, masteriesQuery } = useHistory()
  const { maybeUser, recentSearches } = useUser()

  const [isOpen, setIsOpen] = useState(false)
  const close = useCallback(() => setIsOpen(false), [])

  const platformWithRiotIdFromLocation = usePlatformWithRiotIdFromLocation()

  const [platform, setPlatform] = useState<Platform>(
    platformWithRiotIdFromLocation?.platform ?? Platform.defaultPlatform,
  )

  const riotIdFromLocation = platformWithRiotIdFromLocation?.riotId
  const [summoner, setSummoner] = useState<Either<SummonerName, RiotId>>(
    riotIdFromLocation !== undefined
      ? Either.right(riotIdFromLocation)
      : Either.left(SummonerName('')),
  )

  useEffect(() => {
    if (riotIdFromLocation !== undefined) {
      setSummoner(Either.right(riotIdFromLocation))
    }
  }, [riotIdFromLocation])

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select()
    setIsOpen(true)
  }, [])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()

      type To = {
        profile: string
        game: string
      }

      const to = pipe(
        summoner,
        Either.fold(
          (name): To => ({
            profile: appRoutes.platformSummonerName(
              platform,
              name,
              MasteriesQuery.toPartial({ ...masteriesQuery, search: Maybe.none }),
            ),
            game: appRoutes.platformSummonerNameGame(platform, name),
          }),
          (riotId): To => ({
            profile: appRoutes.platformRiotId(
              platform,
              riotId,
              MasteriesQuery.toPartial({ ...masteriesQuery, search: Maybe.none }),
            ),
            game: appRoutes.platformRiotIdGame(platform, riotId),
          }),
        ),
      )

      const parser = appParsers.platformRiotIdGame.map(() => to.game)

      pipe(
        matchLocation(parser),
        Maybe.getOrElse(() => to.profile),
        navigate,
      )
    },
    [masteriesQuery, matchLocation, navigate, platform, summoner],
  )

  const searches: List<React.ReactElement> = List.compact([
    pipe(
      maybeUser,
      Maybe.chain(u => u.linkedRiotAccount),
      Maybe.map(s => (
        // eslint-disable-next-line react/jsx-key, deprecation/deprecation
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
              // eslint-disable-next-line deprecation/deprecation
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
      <div className="flex gap-1 border border-goldenrod pr-1">
        <ClickOutside onClickOutside={close}>
          <SearchSummonerInput
            summoner={summoner}
            setSummoner={setSummoner}
            handleFocus={handleFocus}
          />
          <ul
            className={cx(
              'absolute top-full z-40 max-h-[calc(100vh_-_5rem)] min-w-[336px] items-center gap-y-3 overflow-auto border border-goldenrod bg-zinc-900 py-2',
              Maybe.isSome(maybeUser) ? 'grid-cols-[auto_auto_auto]' : 'grid-cols-[auto_1fr] pr-3',
              showSearches ? 'grid' : 'hidden',
            )}
          >
            {concatWithHr(searches)}
          </ul>
        </ClickOutside>
        <button type="submit">
          <SearchOutline className="h-6 text-goldenrod" />
        </button>
      </div>
    </form>
  )
}

function concatWithHr(es: List<React.ReactElement>): React.ReactElement | null {
  return pipe(
    es,
    NonEmptyArray.fromReadonlyArray,
    Maybe.fold(
      () => null,
      NonEmptyArray.concatAll({
        concat: (x, y) => (
          <>
            {x}
            <div className="w-[calc(100%_-_1rem)] justify-self-end border-t border-goldenrod" />
            <div className="border-t border-goldenrod" />
            <div className="w-[calc(100%_-_1rem)] border-t border-goldenrod" />
            {y}
          </>
        ),
      }),
    ),
  )
}
