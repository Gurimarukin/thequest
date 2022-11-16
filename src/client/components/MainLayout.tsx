/* eslint-disable functional/no-expression-statement */
import { pipe } from 'fp-ts/function'
import { lens } from 'monocle-ts'
import React, { useCallback, useMemo, useState } from 'react'

import { apiRoutes } from '../../shared/ApiRouter'
import { LoginPayload } from '../../shared/models/api/user/LoginPayload'
import type { UserView } from '../../shared/models/api/user/UserView'
import { Either, Future, Maybe } from '../../shared/utils/fp'

import { useUser } from '../contexts/UserContext'
import { Assets } from '../imgs/Assets'
import { PersonIcon } from '../imgs/svgIcons'
import { appRoutes } from '../router/AppRouter'
import { futureRunUnsafe } from '../utils/futureRunUnsafe'
import { http } from '../utils/http'
import { ClickOutside } from './ClickOutside'
import { Link } from './Link'

export const MainLayout: React.FC = ({ children }) => {
  const { user } = useUser()

  return (
    <div className="h-full flex flex-col">
      <header className="bg-zinc-900 border-b border-goldenrod flex justify-center">
        <div className="max-w-7xl px-3 py-2 w-full flex justify-between items-center relative">
          <Link to={appRoutes.index}>
            <img src={Assets.iconYuumi} alt="Home icon (Yuumi)" className="w-12" />
          </Link>
          {pipe(
            user,
            Maybe.fold(
              () => <AccountDisconnected />,
              u => <AccountConnected user={u} />,
            ),
          )}
        </div>
      </header>
      <main className="grow">{children}</main>
    </div>
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
            className="absolute right-[1px] top-[calc(100%_+_1px)] flex flex-col bg-zinc-900 border-goldenrod border-x border-b px-5 py-4 gap-2"
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
          <PersonIcon className="h-7 fill-wheat" />
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
