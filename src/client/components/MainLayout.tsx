/* eslint-disable functional/no-expression-statement */
import { flow, pipe } from 'fp-ts/function'
import { lens } from 'monocle-ts'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { Platform } from '../../shared/models/api/Platform'
import type { SummonerShort } from '../../shared/models/api/summoner/SummonerShort'
import { LoginPayload } from '../../shared/models/api/user/LoginPayload'
import type { UserView } from '../../shared/models/api/user/UserView'
import { Either, Future, List, Maybe } from '../../shared/utils/fp'

import { apiUserLoginPost, apiUserLogoutPost } from '../api'
import { useHistory } from '../contexts/HistoryContext'
import { useStaticData } from '../contexts/StaticDataContext'
import { useUser } from '../contexts/UserContext'
import { useSummonerNameFromLocation } from '../hooks/useSummonerNameFromLocation'
import { Assets } from '../imgs/Assets'
import {
  CloseFilledIcon,
  PersonFilledIcon,
  SearchOutlineIcon,
  StarFilledIcon,
  StarOutlineIcon,
  TimeOutlineIcon,
} from '../imgs/svgIcons'
import { MasteriesQuery } from '../models/masteriesQuery/MasteriesQuery'
import { appRoutes } from '../router/AppRouter'
import { cssClasses } from '../utils/cssClasses'
import { futureRunUnsafe } from '../utils/futureRunUnsafe'
import { ClickOutside } from './ClickOutside'
import { Link } from './Link'
import { Select } from './Select'

export const MainLayout: React.FC = ({ children }) => {
  const { user } = useUser()

  return (
    <div className="h-full flex flex-col">
      <header className="bg-zinc-900 border-b border-goldenrod flex justify-center">
        <div className="max-w-7xl px-3 py-2 w-full flex justify-between items-center relative">
          <div className="flex gap-6 items-center">
            <Link to={appRoutes.index}>
              <img src={Assets.iconYuumi} alt="Home icon (Yuumi)" className="w-12" />
            </Link>
            <SearchSummoner />
          </div>
          {pipe(
            user,
            Maybe.fold(
              () => <AccountDisconnected />,
              u => <AccountConnected user={u} />,
            ),
          )}
        </div>
      </header>
      <main className="grow overflow-auto">{children}</main>
    </div>
  )
}

const SearchSummoner = (): JSX.Element => {
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
          className="border-l border-y border-goldenrod bg-black pl-1"
        />
        <ClickOutside onClickOutside={hide}>
          <input
            type="text"
            value={summonerName}
            onChange={handleChange}
            onFocus={handleFocus}
            className="border border-goldenrod bg-transparent px-2 w-52"
          />
          <ul
            className={cssClasses(
              'absolute top-full z-10 bg-zinc-900 border border-goldenrod grid-cols-[auto_auto_auto] items-center gap-y-3 py-2 max-h-[calc(100vh_-_5rem)] overflow-auto',
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
          <SearchOutlineIcon className="h-6 text-goldenrod -ml-7" />
        </button>
      </form>
    </div>
  )
}

const Hr = (): JSX.Element => (
  <>
    <div className="border-t border-goldenrod w-[calc(100%_-_1rem)] justify-self-end" />
    <div className="border-t border-goldenrod" />
    <div className="border-t border-goldenrod w-[calc(100%_-_1rem)]" />
  </>
)

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
                <TimeOutlineIcon className="h-4 invisible" />
              </span>
            )
          case 'recent':
            return (
              <button type="button" onClick={handleRemoveRecentClick} className="group p-2">
                <TimeOutlineIcon className="h-4 text-goldenrod group-hover:hidden" />
                <CloseFilledIcon className="h-4 fill-red-700 hidden group-hover:flex" />
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
        <span className="grow ml-2">{summoner.name}</span>
        <span className="ml-4">{summoner.platform}</span>
      </Link>
      {((): JSX.Element => {
        switch (type) {
          case 'favorite':
            return (
              <button
                type="button"
                onClick={handleRemoveFavoriteClick}
                className="px-3 pt-2 pb-3 fill-goldenrod hover:fill-red-700"
              >
                <StarFilledIcon className="h-5" />
              </button>
            )
          case 'recent':
            return (
              <button
                type="button"
                onClick={handleAddFavoriteClick}
                className="px-3 pt-2 pb-3 text-goldenrod hover:text-wheat"
              >
                <StarOutlineIcon className="h-5" />
              </button>
            )
        }
      })()}
    </li>
  )
}

type State = {
  readonly userName: string
  readonly password: string
}

const emptyState: State = { userName: '', password: '' }

export const userNameLens = pipe(lens.id<State>(), lens.prop('userName'))
export const passwordLens = pipe(lens.id<State>(), lens.prop('password'))

const AccountDisconnected = (): JSX.Element => {
  const { refreshUser } = useUser()

  const [loginIsVisible, setLoginIsVisible] = useState(false)
  const toggleLogin = useCallback(() => setLoginIsVisible(v => !v), [])
  const hideLogin = useCallback(() => setLoginIsVisible(false), [])

  const [error, setError] = useState<Maybe<string>>(Maybe.none)

  const [state, setState] = useState(emptyState)
  const updateUserName = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setState(userNameLens.set(e.target.value))
    setError(Maybe.none)
  }, [])
  const updatePassword = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setState(passwordLens.set(e.target.value))
    setError(Maybe.none)
  }, [])

  const validated = useMemo(() => LoginPayload.codec.decode(state), [state])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      pipe(
        validated,
        Either.map(
          flow(
            apiUserLoginPost,
            Future.map(refreshUser),
            Future.orElse(() => Future.right(setError(Maybe.some('error')))),
            futureRunUnsafe,
          ),
        ),
      )
    },
    [refreshUser, validated],
  )

  return (
    <ClickOutside onClickOutside={hideLogin}>
      <div>
        <button
          type="button"
          onClick={toggleLogin}
          className="border border-goldenrod py-1 px-4 hover:bg-goldenrod/75 hover:text-black"
        >
          Connexion
        </button>
        {loginIsVisible ? (
          <form
            onSubmit={handleSubmit}
            className="absolute right-[1px] top-full flex flex-col bg-zinc-900 border-goldenrod border px-5 py-4 gap-2 z-10"
          >
            <label className="flex justify-between gap-3">
              <span>Login :</span>
              <input
                type="text"
                value={state.userName}
                onChange={updateUserName}
                className="border border-goldenrod bg-transparent items-center"
              />
            </label>
            <label className="flex justify-between gap-3">
              <span>Mot de passe :</span>
              <input
                type="password"
                value={state.password}
                onChange={updatePassword}
                className="border border-goldenrod bg-transparent items-center"
              />
            </label>
            <div className="self-center mt-2 flex flex-col items-center gap-2">
              <button
                type="submit"
                disabled={Either.isLeft(validated)}
                className="bg-goldenrod text-black py-1 px-4 enabled:hover:bg-goldenrod/75 disabled:cursor-default disabled:bg-zinc-600"
              >
                Connexion
              </button>
              {pipe(
                error,
                Maybe.fold(
                  () => null,
                  e => <span className="text-red-700">{e}</span>,
                ),
              )}
            </div>
          </form>
        ) : null}
      </div>
    </ClickOutside>
  )
}

type AccountConnectedProps = {
  readonly user: UserView
}

const AccountConnected = ({ user }: AccountConnectedProps): JSX.Element => {
  const { refreshUser } = useUser()

  const [menuIsVisible, setMenuIsVisible] = useState(false)
  const toggleMenu = useCallback(() => setMenuIsVisible(v => !v), [])
  const hideMenu = useCallback(() => setMenuIsVisible(false), [])

  const disconnect = useCallback(
    () => pipe(apiUserLogoutPost, Future.map(refreshUser), futureRunUnsafe),
    [refreshUser],
  )

  return (
    <ClickOutside onClickOutside={hideMenu}>
      <div>
        <button type="button" onClick={toggleMenu} className="flex items-end gap-3 py-2">
          <span>{user.userName}</span>
          <PersonFilledIcon className="h-7 fill-wheat" />
        </button>
        {menuIsVisible ? (
          <ul className="absolute right-0 top-[calc(100%_+_1px)] p-[2px] gap-[2px] flex flex-col">
            <li>
              <button
                type="button"
                onClick={disconnect}
                className="bg-goldenrod text-black py-1 px-4 hover:bg-goldenrod/75"
              >
                Déconnexion
              </button>
            </li>
          </ul>
        ) : null}
      </div>
    </ClickOutside>
  )
}
