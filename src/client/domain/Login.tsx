/* eslint-disable functional/no-expression-statements */
import { task } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { lens } from 'monocle-ts'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { LoginPasswordPayload } from '../../shared/models/api/user/LoginPasswordPayload'
import { Either, Future, Maybe } from '../../shared/utils/fp'

import { apiUserLoginPasswordPost } from '../api'
import { Link } from '../components/Link'
import { Loading } from '../components/Loading'
import { MainLayout } from '../components/mainLayout/MainLayout'
import { useHistory } from '../contexts/HistoryContext'
import { useUser } from '../contexts/UserContext'
import { DiscordLogoTitle } from '../imgs/DiscordLogoTitle'
import { appRoutes } from '../router/AppRouter'
import { discordApiOAuth2Authorize } from '../utils/discordApiOAuth2Authorize'
import { futureRunUnsafe } from '../utils/futureRunUnsafe'

type State = {
  userName: string
  password: string
}
const emptyState: State = { userName: '', password: '' }

export const userNameLens = pipe(lens.id<State>(), lens.prop('userName'))
export const passwordLens = pipe(lens.id<State>(), lens.prop('password'))

export const Login: React.FC = () => {
  const { navigate } = useHistory()
  const { maybeUser, refreshUser } = useUser()

  useEffect(() => {
    if (Maybe.isSome(maybeUser)) navigate(appRoutes.index)
  }, [maybeUser, navigate])

  const [isLoading, setIsLoading] = useState(false)
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
        Either.map(valid => {
          setIsLoading(true)
          return pipe(
            valid,
            apiUserLoginPasswordPost,
            Future.chain(() => refreshUser),
            Future.orElseW(() => Future.successful(setError(Maybe.some('error')))),
            task.chainFirstIOK(() => () => setIsLoading(false)),
            futureRunUnsafe,
          )
        }),
      )
    },
    [refreshUser, validated],
  )

  return (
    <MainLayout>
      <div className="flex flex-col items-center gap-12 px-4 py-20">
        <a
          href={discordApiOAuth2Authorize('login')}
          className="flex items-center rounded-md bg-discord-blurple px-6 text-white"
        >
          Se connecter avec
          <DiscordLogoTitle className="my-3 ml-3 h-6" />
        </a>

        <p>ou</p>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col items-center gap-8 border border-goldenrod bg-zinc-900 px-12 py-8"
        >
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
          <div className="flex flex-col items-center gap-2 self-center">
            <button
              type="submit"
              disabled={isLoading || Either.isLeft(validated)}
              className="flex items-center gap-2 bg-goldenrod px-4 py-1 text-black enabled:hover:bg-goldenrod/75 disabled:bg-grey-disabled"
            >
              Connexion {isLoading ? <Loading className="h-4" /> : null}
            </button>
            {pipe(
              error,
              Maybe.fold(
                () => null,
                e => <span className="text-red">{e}</span>,
              ),
            )}
          </div>
        </form>

        <div className="flex w-full max-w-xl flex-col items-center">
          <span>Pas de compte ?</span>
          <Link to={appRoutes.register} className="underline">
            S’inscrire
          </Link>
        </div>
      </div>
    </MainLayout>
  )
}
