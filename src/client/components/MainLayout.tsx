/* eslint-disable functional/no-expression-statement */
import { Route, parse } from 'fp-ts-routing'
import { pipe } from 'fp-ts/function'
import { lens } from 'monocle-ts'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { apiRoutes } from '../../shared/ApiRouter'
import { Platform } from '../../shared/models/api/Platform'
import type { SummonerShort } from '../../shared/models/api/SummonerShort'
import { LoginPayload } from '../../shared/models/api/user/LoginPayload'
import type { UserView } from '../../shared/models/api/user/UserView'
import { Either, Future, List, Maybe } from '../../shared/utils/fp'

import { useHistory } from '../contexts/HistoryContext'
import { useStaticData } from '../contexts/StaticDataContext'
import { useUser } from '../contexts/UserContext'
import { Assets } from '../imgs/Assets'
import {
  CloseFilledIcon,
  PersonFilledIcon,
  SearchOutlineIcon,
  StarFilledIcon,
  StarOutlineIcon,
  TimeOutlineIcon,
} from '../imgs/svgIcons'
import { appParsers, appRoutes } from '../router/AppRouter'
import { cssClasses } from '../utils/cssClasses'
import { futureRunUnsafe } from '../utils/futureRunUnsafe'
import { http } from '../utils/http'
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
  const { location, navigate } = useHistory()
  const { user, recentSearches } = useUser()

  const [isOpen, setIsOpen] = useState(false)
  const hide = useCallback(() => setIsOpen(false), [])

  const summonerNameFromLocation = useMemo(
    () =>
      parse(
        appParsers.platformSummonerName.map(f => Maybe.some(f.summonerName)),
        Route.parse(location.pathname),
        Maybe.none,
      ),
    [location.pathname],
  )
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
      navigate(appRoutes.platformSummonerName(platform, summonerName))
    },
    [navigate, platform, summonerName],
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
            className="border border-goldenrod bg-transparent px-2"
          />
          <ul
            className={cssClasses(
              'absolute top-full z-10 bg-zinc-900 border border-goldenrod grid-cols-[auto_auto_auto] items-center gap-y-3 py-2',
              ['hidden', !showSearches],
              ['grid', showSearches],
            )}
          >
            {favoriteSearches.map(s => (
              <SummonerSearch key={`${s.platform}${s.name}`} type="favorite" summoner={s} />
            ))}
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

type SummonerSearchProps = {
  readonly type: 'favorite' | 'recent'
  readonly summoner: SummonerShort
}

const SummonerSearch = ({ type, summoner }: SummonerSearchProps): JSX.Element => {
  const { addFavoriteSearch, removeRecentSearch } = useUser()
  const staticData = useStaticData()

  const handleAddFavoriteClick = useCallback(
    () => addFavoriteSearch(summoner),
    [addFavoriteSearch, summoner],
  )

  const handleRemoveFavoriteClick = useCallback(
    () => removeRecentSearch(summoner.id),
    [removeRecentSearch, summoner.id],
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
              <button type="button" onClick={handleRemoveFavoriteClick} className="group p-2">
                <TimeOutlineIcon className="h-4 text-goldenrod group-hover:hidden" />
                <CloseFilledIcon className="h-4 fill-red-700 hidden group-hover:flex" />
              </button>
            )
        }
      })()}
      <Link
        to={appRoutes.platformSummonerName(summoner.platform, summoner.name)}
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
              <button type="button" className="p-3 fill-goldenrod hover:fill-red-700">
                <StarFilledIcon className="h-5" />
              </button>
            )
          case 'recent':
            return (
              <button
                type="button"
                onClick={handleAddFavoriteClick}
                className="p-3 text-goldenrod hover:text-wheat"
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

  const [error, setError] = useState('')

  const [state, setState] = useState(emptyState)
  const updateUserName = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setState(userNameLens.set(e.target.value))
    setError('')
  }, [])
  const updatePassword = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setState(passwordLens.set(e.target.value))
    setError('')
  }, [])

  const validated = useMemo(() => LoginPayload.codec.decode(state), [state])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      pipe(
        validated,
        Either.map(payload =>
          pipe(
            http(apiRoutes.user.login.post, { json: [LoginPayload.codec, payload] }),
            Future.map(refreshUser),
            Future.orElse(() => Future.right(setError('error'))),
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
            <div className="self-center mt-2">
              <span>{error}</span>
              <button
                type="submit"
                disabled={Either.isLeft(validated)}
                className="bg-goldenrod text-black py-1 px-4 enabled:hover:bg-goldenrod/75 disabled:cursor-default disabled:bg-zinc-600"
              >
                Connexion
              </button>
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
    () => pipe(http(apiRoutes.user.logout.post), Future.map(refreshUser), futureRunUnsafe),
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
