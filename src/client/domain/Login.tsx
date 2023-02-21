/* eslint-disable functional/no-expression-statements */
import { flow, pipe } from 'fp-ts/function'
import { lens } from 'monocle-ts'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { LoginPasswordPayload } from '../../shared/models/api/user/LoginPasswordPayload'
import { Either, Future, Maybe } from '../../shared/utils/fp'

import { apiUserLoginPasswordPost } from '../api'
import { Link } from '../components/Link'
import { MainLayout } from '../components/mainLayout/MainLayout'
import { useHistory } from '../contexts/HistoryContext'
import { useUser } from '../contexts/UserContext'
import { appRoutes } from '../router/AppRouter'
import { discordApiOAuth2Authorize } from '../utils/discordApiOAuth2Authorize'
import { futureRunUnsafe } from '../utils/futureRunUnsafe'

type State = {
  readonly userName: string
  readonly password: string
}
const emptyState: State = { userName: '', password: '' }

export const userNameLens = pipe(lens.id<State>(), lens.prop('userName'))
export const passwordLens = pipe(lens.id<State>(), lens.prop('password'))

export const Login = (): JSX.Element => {
  const { navigate } = useHistory()
  const { user, refreshUser } = useUser()

  useEffect(() => {
    if (Maybe.isSome(user)) navigate(appRoutes.index)
  }, [navigate, user])

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

  const validated = useMemo(() => LoginPasswordPayload.codec.decode(state), [state])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      pipe(
        validated,
        Either.map(
          flow(
            apiUserLoginPasswordPost,
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
    <MainLayout>
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
      <hr />
      <a href={discordApiOAuth2Authorize('login')}>LOGIN WITH DISCORD</a>
      <hr />
      <br />
      CONNEXION
      <br />
      Pas de compte ? <Link to={appRoutes.register}>S'inscrire</Link>
    </MainLayout>
  )
}
