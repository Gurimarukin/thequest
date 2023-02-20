/* eslint-disable functional/no-expression-statements */
import { pipe } from 'fp-ts/function'
import React, { useCallback, useEffect, useState } from 'react'

import { Platform } from '../../../shared/models/api/Platform'
import type { SummonerShort } from '../../../shared/models/api/summoner/SummonerShort'
import { List, Maybe } from '../../../shared/utils/fp'

import { useHistory } from '../../contexts/HistoryContext'
import { useStaticData } from '../../contexts/StaticDataContext'
import { useUser } from '../../contexts/UserContext'
import { useSummonerNameFromLocation } from '../../hooks/useSummonerNameFromLocation'
import {
  CloseFilled,
  SearchOutline,
  StarFilled,
  StarOutline,
  TimeOutline,
} from '../../imgs/svgIcons'
import { MasteriesQuery } from '../../models/masteriesQuery/MasteriesQuery'
import { appRoutes } from '../../router/AppRouter'
import { cssClasses } from '../../utils/cssClasses'
import { ClickOutside } from '../ClickOutside'
import { Link } from '../Link'
import { Select } from '../Select'

export const SearchSummoner = (): JSX.Element => {
  const { navigate, masteriesQuery } = useHistory()
  const { user, recentSearches } = useUser()

  const [isOpen, setIsOpen] = useState(false)
  const hide = useCallback(() => setIsOpen(false), [])

  const summonerNameFromLocation = useSummonerNameFromLocation()
  useEffect(() => {
    pipe(summonerNameFromLocation, Maybe.map(setSummonerName))
  }, [summonerNameFromLocation])

  const [summonerName, setSummonerName] = useState(
    pipe(
      summonerNameFromLocation,
      Maybe.getOrElse(() => ''),
    ),
  )
  const [platform, setPlatform] = useState<Platform>('EUW1')

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
          MasteriesQuery.toPartial(masteriesQuery),
        ),
      )
    },
    [masteriesQuery, navigate, platform, summonerName],
  )

  const favoriteSearches = pipe(
    user,
    Maybe.fold(
      () => List.empty,
      u => u.favoriteSearches,
    ),
  )
  const showSearches =
    isOpen && (List.isNonEmpty(favoriteSearches) || List.isNonEmpty(recentSearches))

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex h-8 text-sm">
        <Select<Platform>
          options={Platform.values}
          value={platform}
          setValue={setPlatform}
          className="border-y border-l border-goldenrod bg-black pl-1"
        />
        <ClickOutside onClickOutside={hide}>
          <input
            type="text"
            value={summonerName}
            onChange={handleChange}
            onFocus={handleFocus}
            className="w-52 border border-goldenrod bg-transparent px-2"
          />
          <ul
            className={cssClasses(
              'absolute top-full z-10 max-h-[calc(100vh_-_5rem)] grid-cols-[auto_auto_auto] items-center gap-y-3 overflow-auto border border-goldenrod bg-zinc-900 py-2',
              ['hidden', !showSearches],
              ['grid', showSearches],
            )}
          >
            {favoriteSearches.map(s => (
              <SummonerSearch key={`${s.platform}${s.name}`} type="favorite" summoner={s} />
            ))}
            {List.isNonEmpty(favoriteSearches) && List.isNonEmpty(recentSearches) ? <Hr /> : null}
            {recentSearches.map(s => (
              <SummonerSearch key={`${s.platform}${s.name}`} type="recent" summoner={s} />
            ))}
          </ul>
        </ClickOutside>
        <button type="submit">
          <SearchOutline className="-ml-7 h-6 text-goldenrod" />
        </button>
      </form>
    </div>
  )
}

type SummonerSearchProps = {
  readonly type: 'favorite' | 'recent'
  readonly summoner: SummonerShort
}

const SummonerSearch = ({ type, summoner }: SummonerSearchProps): JSX.Element => {
  const { masteriesQuery } = useHistory()
  const { addFavoriteSearch, removeFavoriteSearch, removeRecentSearch } = useUser()
  const staticData = useStaticData()

  const handleRemoveRecentClick = useCallback(
    () => removeRecentSearch(summoner),
    [removeRecentSearch, summoner],
  )

  const handleAddFavoriteClick = useCallback(
    () => addFavoriteSearch(summoner),
    [addFavoriteSearch, summoner],
  )

  const handleRemoveFavoriteClick = useCallback(
    () => removeFavoriteSearch(summoner),
    [removeFavoriteSearch, summoner],
  )

  return (
    <li className="contents">
      {((): JSX.Element => {
        switch (type) {
          case 'favorite':
            return (
              <span className="p-2">
                <TimeOutline className="invisible h-4" />
              </span>
            )
          case 'recent':
            return (
              <button type="button" onClick={handleRemoveRecentClick} className="group p-2">
                <TimeOutline className="h-4 text-goldenrod group-hover:hidden" />
                <CloseFilled className="hidden h-4 fill-red-700 group-hover:flex" />
              </button>
            )
        }
      })()}
      <Link
        to={appRoutes.platformSummonerName(
          summoner.platform,
          summoner.name,
          MasteriesQuery.toPartial(masteriesQuery),
        )}
        className="flex items-center hover:underline"
      >
        <img
          src={staticData.assets.summonerIcon(summoner.profileIconId)}
          alt={`${summoner.name}'s icon`}
          className="w-12"
        />
        <span className="ml-2 grow">{summoner.name}</span>
        <span className="ml-4">{summoner.platform}</span>
      </Link>
      {((): JSX.Element => {
        switch (type) {
          case 'favorite':
            return (
              <button
                type="button"
                onClick={handleRemoveFavoriteClick}
                className="fill-goldenrod px-3 pt-2 pb-3 hover:fill-red-700"
              >
                <StarFilled className="h-5" />
              </button>
            )
          case 'recent':
            return (
              <button
                type="button"
                onClick={handleAddFavoriteClick}
                className="px-3 pt-2 pb-3 text-goldenrod hover:text-wheat"
              >
                <StarOutline className="h-5" />
              </button>
            )
        }
      })()}
    </li>
  )
}

const Hr = (): JSX.Element => (
  <>
    <div className="w-[calc(100%_-_1rem)] justify-self-end border-t border-goldenrod" />
    <div className="border-t border-goldenrod" />
    <div className="w-[calc(100%_-_1rem)] border-t border-goldenrod" />
  </>
)
