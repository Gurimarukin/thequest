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
    <div className="flex h-full flex-col">
      <header className="flex justify-center border-b border-goldenrod bg-zinc-900">
        <div className="relative flex w-full max-w-7xl items-center justify-between px-3 py-2">
          <div className="flex items-center gap-6">
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
          <SearchOutlineIcon className="-ml-7 h-6 text-goldenrod" />
        </button>
      </form>
    </div>
  )
}

const Hr = (): JSX.Element => (
  <>
    <div className="w-[calc(100%_-_1rem)] justify-self-end border-t border-goldenrod" />
    <div className="border-t border-goldenrod" />
    <div className="w-[calc(100%_-_1rem)] border-t border-goldenrod" />
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
                <TimeOutlineIcon className="invisible h-4" />
              </span>
            )
          case 'recent':
            return (
              <button type="button" onClick={handleRemoveRecentClick} className="group p-2">
                <TimeOutlineIcon className="h-4 text-goldenrod group-hover:hidden" />
                <CloseFilledIcon className="hidden h-4 fill-red-700 group-hover:flex" />
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
          Compte
        </button>
        {loginIsVisible ? (
          <Menu>
            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
              <div className="grid grid-cols-[auto_auto] gap-x-3 gap-y-2">
                <label className="contents">
                  <span>Login :</span>
                  <input
                    type="text"
                    value={state.userName}
                    onChange={updateUserName}
                    className="border border-goldenrod bg-transparent"
                  />
                </label>
                <label className="contents">
                  <span>Mot de passe :</span>
                  <input
                    type="password"
                    value={state.password}
                    onChange={updatePassword}
                    className="border border-goldenrod bg-transparent"
                  />
                </label>
              </div>
              <div className="mt-1 flex flex-col items-center gap-2 self-center">
                <button
                  type="submit"
                  disabled={Either.isLeft(validated)}
                  className="bg-goldenrod py-1 px-4 text-black enabled:hover:bg-goldenrod/75 disabled:cursor-default disabled:bg-zinc-600"
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
            <div className="flex justify-center border-t border-goldenrod pt-3">
              <Link to={appRoutes.register} className="underline">
                Inscription
              </Link>
            </div>
          </Menu>
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
          <Menu>
            <ul className="flex flex-col gap-[2px]">
              <li>
                <button
                  type="button"
                  onClick={disconnect}
                  className="bg-goldenrod py-1 px-4 text-black hover:bg-goldenrod/75"
                >
                  Déconnexion
                </button>
              </li>
            </ul>
          </Menu>
        ) : null}
      </div>
    </ClickOutside>
  )
}

const Menu: React.FC = ({ children }) => (
  <div className="absolute right-[1px] top-full z-10 flex flex-col gap-3 border border-goldenrod bg-zinc-900 px-5 py-4">
    {children}
  </div>
)
