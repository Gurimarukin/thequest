/* eslint-disable functional/no-expression-statement */
import { flow, pipe } from 'fp-ts/function'
import { lens } from 'monocle-ts'
import React, { useCallback, useMemo, useState } from 'react'

import { ClearPassword } from '../../shared/models/api/user/ClearPassword'
import { LoginPasswordPayload } from '../../shared/models/api/user/LoginPasswordPayload'
import type { NotUsed } from '../../shared/utils/fp'
import { Either, Future, Maybe, toNotUsed } from '../../shared/utils/fp'
import { validatePassword } from '../../shared/validations/validatePassword'

import { apiUserRegisterPost } from '../api'
import { Link } from '../components/Link'
import { SimpleMainLayout } from '../components/mainLayout/SimpleMainLayout'
import { useHistory } from '../contexts/HistoryContext'
import { appRoutes } from '../router/AppRouter'
import { futureRunUnsafe } from '../utils/futureRunUnsafe'

type State = {
  readonly userName: string
  readonly password: string
  readonly confirmPassword: string
}

const emptyState: State = { userName: '', password: '', confirmPassword: '' }

const userNameLens = pipe(lens.id<State>(), lens.prop('userName'))
const passwordLens = pipe(lens.id<State>(), lens.prop('password'))
const confirmPasswordLens = pipe(lens.id<State>(), lens.prop('confirmPassword'))

export const Register = (): JSX.Element => {
  const { navigate } = useHistory()

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
  const updateConfirmPassword = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setState(confirmPasswordLens.set(e.target.value))
    setError(Maybe.none)
  }, [])

  const validated = useMemo(() => LoginPasswordPayload.codec.decode(state), [state])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      pipe(
        validated,
        Either.map(payload => {
          pipe(
            validateOnSubmit(payload.password, state.confirmPassword),
            Either.foldW(flow(Maybe.some, setError), () =>
              pipe(
                apiUserRegisterPost(payload),
                Future.map(() => navigate(appRoutes.index)),
                Future.orElse(() => Future.right(setError(Maybe.some('error')))),
                futureRunUnsafe,
              ),
            ),
          )
        }),
      )
    },
    [navigate, state, validated],
  )

  return (
    <SimpleMainLayout>
      <div className="flex grow flex-col justify-center">
        <form onSubmit={handleSubmit} className="flex flex-col items-center">
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
            <label className="contents">
              <span>Confirmation mot de passe :</span>
              <input
                type="password"
                value={state.confirmPassword}
                onChange={updateConfirmPassword}
                className="border border-goldenrod bg-transparent"
              />
            </label>
          </div>
          <div className="mt-4 flex flex-col items-center gap-2 self-center">
            <button
              type="submit"
              disabled={Either.isLeft(validated)}
              className="bg-goldenrod py-1 px-4 text-black enabled:hover:bg-goldenrod/75 disabled:cursor-default disabled:bg-zinc-600"
            >
              Inscription
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
        <br />
        Déjà un compte ? <Link to={appRoutes.login}>Se connecter</Link>
      </div>
    </SimpleMainLayout>
  )
}

const validateOnSubmit = (
  password: ClearPassword,
  confirmPassword: string,
): Either<string, NotUsed> =>
  ClearPassword.unwrap(password) !== confirmPassword
    ? Either.left('Les mots de passe doivent être identiques')
    : pipe(validatePassword(password), Either.map(toNotUsed))
