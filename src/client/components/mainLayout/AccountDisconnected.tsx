/* eslint-disable functional/no-expression-statement */
import { flow, pipe } from 'fp-ts/function'
import { lens } from 'monocle-ts'
import React, { useCallback, useMemo, useState } from 'react'

import { LoginPayload } from '../../../shared/models/api/user/LoginPayload'
import { Either, Future, Maybe } from '../../../shared/utils/fp'

import { apiUserLoginPost } from '../../api'
import { useUser } from '../../contexts/UserContext'
import { appRoutes } from '../../router/AppRouter'
import { futureRunUnsafe } from '../../utils/futureRunUnsafe'
import { ClickOutside } from '../ClickOutside'
import { Link } from '../Link'
import { Menu } from './Menu'

type State = {
  readonly userName: string
  readonly password: string
}
const emptyState: State = { userName: '', password: '' }

export const userNameLens = pipe(lens.id<State>(), lens.prop('userName'))
export const passwordLens = pipe(lens.id<State>(), lens.prop('password'))

export const AccountDisconnected = (): JSX.Element => {
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
            <Link
              to={appRoutes.login}
              className="bg-goldenrod py-1 px-4 text-black enabled:hover:bg-goldenrod/75 disabled:cursor-default disabled:bg-zinc-600"
            >
              Connexion
            </Link>
            <div className="flex justify-center">
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
