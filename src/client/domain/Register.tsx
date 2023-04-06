/* eslint-disable functional/no-expression-statements */
import { flow, pipe } from 'fp-ts/function'
import { lens } from 'monocle-ts'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { ClearPassword } from '../../shared/models/api/user/ClearPassword'
import { LoginPasswordPayload } from '../../shared/models/api/user/LoginPasswordPayload'
import type { NotUsed } from '../../shared/utils/fp'
import { Either, Future, Maybe, toNotUsed } from '../../shared/utils/fp'
import { validatePassword } from '../../shared/validations/validatePassword'

import { apiUserRegisterPost } from '../api'
import { Link } from '../components/Link'
import { MainLayout } from '../components/mainLayout/MainLayout'
import { constants } from '../config/constants'
import { useHistory } from '../contexts/HistoryContext'
import { useUser } from '../contexts/UserContext'
import { DiscordLogoTitle } from '../imgs/DiscordLogoTitle'
import { CheckMarkSharp } from '../imgs/svgIcons'
import { appRoutes } from '../router/AppRouter'
import { cssClasses } from '../utils/cssClasses'
import { discordApiOAuth2Authorize } from '../utils/discordApiOAuth2Authorize'
import { futureRunUnsafe } from '../utils/futureRunUnsafe'

type State = {
  userName: string
  password: string
  confirmPassword: string
}

const emptyState: State = { userName: '', password: '', confirmPassword: '' }

const userNameLens = pipe(lens.id<State>(), lens.prop('userName'))
const passwordLens = pipe(lens.id<State>(), lens.prop('password'))
const confirmPasswordLens = pipe(lens.id<State>(), lens.prop('confirmPassword'))

export const Register = (): JSX.Element => {
  const { navigate } = useHistory()
  const { user } = useUser()

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
                Future.map(() => navigate(appRoutes.login)),
                Future.orElse(() => Future.successful(setError(Maybe.some('error')))),
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
    <MainLayout>
      <div className="flex flex-col items-center gap-12 px-4 py-20">
        <p className="leading-8">
          Avoir un compte lié à un compte Discord, lui-même lié à un compte Riot Games, permet
          d’avoir accès à plus de fonctionnalités.
          <br />
          Comme Riot Games, c'est tout pourri, il n’est pas possible de lier directement un compte
          Riot Games. Il faut passer par un compte Discord et que celui-ci soit lié à un compte Riot
          Games.
        </p>
        <table className="grid grid-cols-[auto_repeat(3,1fr)]">
          <thead className="contents">
            <tr className="contents">
              <th />
              <Th>Sans compte</Th>
              <Th>Avec un compte NON lié à Riot Games</Th>
              <Th>Avec un compte lié à Riot Games</Th>
            </tr>
          </thead>
          <tbody className="contents">
            <tr className="contents">
              <Td className="border-t border-l border-goldenrod pl-6 pt-12">
                Accéder à tous les détails d’un invocateur via la recherche
              </Td>
              <Td className="justify-center border-t border-goldenrod pt-12">{greenCheck}</Td>
              <Td className="justify-center border-t border-goldenrod pt-12">{greenCheck}</Td>
              <Td className="justify-center border-t border-r border-goldenrod pt-12">
                {greenCheck}
              </Td>
            </tr>
            <tr className="contents">
              <Td className="border-l border-goldenrod pl-6">
                Voir les {constants.recentSearches.maxCount} recherches les plus récentes (stockage
                local du navigateur)
              </Td>
              <Td className="justify-center">{greenCheck}</Td>
              <Td className="justify-center">{greenCheck}</Td>
              <Td className="justify-center border-r border-goldenrod">{greenCheck}</Td>
            </tr>
            <tr className="contents">
              <Td className="border-l border-goldenrod pl-6">Ajouter des invocateur en favori</Td>
              <EmptyTd />
              <Td className="justify-center">{greenCheck}</Td>
              <Td className="justify-center border-r border-goldenrod">{greenCheck}</Td>
            </tr>
            <tr className="contents">
              <Td className="border-l border-goldenrod pl-6">
                Garder le compte des fragments de champions (à la main, désolé)
              </Td>
              <EmptyTd />
              <Td className="justify-center">{greenCheck}</Td>
              <Td className="justify-center border-r border-goldenrod">{greenCheck}</Td>
            </tr>
            <tr className="contents">
              <Td className="border-l border-goldenrod pl-6">
                Personnaliser les champions associés à un rôle
              </Td>
              <EmptyTd />
              <Td className="justify-center">{greenCheck}</Td>
              <Td className="justify-center border-r border-goldenrod">{greenCheck}</Td>
            </tr>
            <tr className="contents">
              <Td className="border-l border-goldenrod pl-6">
                Accès rapide au profil d’invocateur lié
              </Td>
              <EmptyTd />
              <EmptyTd />
              <Td className="justify-center border-r border-goldenrod">{greenCheck}</Td>
            </tr>
            <tr className="contents">
              <Td className="flex-col gap-3 border-l border-b border-goldenrod pl-6 pb-12">
                <span className="self-start">
                  Classement dans le temple de la renommée sur le serveur Discord du capitaine :
                </span>
                <div className="flex items-center self-start rounded bg-discord-darkgrey px-6 py-5 font-[baloopaaji2] text-white">
                  <img
                    src={constants.lesQuaisAbattoirs.image}
                    alt={`Icône du serveur ${constants.lesQuaisAbattoirs.name}`}
                    className="w-12 rounded-xl"
                  />
                  <span className="ml-4 flex flex-col">
                    <span className="font-bold">{constants.lesQuaisAbattoirs.name}</span>
                    <span className="text-sm text-gray-400">Serveur Discord</span>
                  </span>
                  <a
                    href={constants.lesQuaisAbattoirs.inviteLink}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-8 rounded bg-discord-darkgreen py-2 px-3 text-sm"
                  >
                    Rejoindre
                  </a>
                </div>
              </Td>
              <EmptyTd className="border-b border-goldenrod pb-12" />
              <EmptyTd className="border-b border-goldenrod pb-12" />
              <Td className="justify-center border-b border-r border-goldenrod pb-12">
                {greenCheck}
              </Td>
            </tr>
          </tbody>
        </table>

        <hr className="w-full max-w-xl border-t border-goldenrod" />

        <a
          href={discordApiOAuth2Authorize('register')}
          className="flex items-center rounded-md bg-discord-blurple px-6 text-white"
        >
          S’inscrire avec
          <DiscordLogoTitle className="my-3 ml-3 h-6 fill-current" />
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
          <div className="flex flex-col items-center gap-2 self-center">
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
        <div className="flex w-full max-w-xl flex-col items-center">
          <span>Déjà un compte ?</span>
          <Link to={appRoutes.login} className="underline">
            Se connecter
          </Link>
        </div>
      </div>
    </MainLayout>
  )
}

const Th: React.FC = ({ children }) => (
  <th className="flex items-center justify-center px-2 pb-3 font-normal">{children}</th>
)

type TdProps = {
  className?: string
}

const Td: React.FC<TdProps> = ({ className, children }) => (
  <td className={cssClasses('flex items-center bg-zinc-900 px-2 py-5', className)}>{children}</td>
)

const EmptyTd = ({ className }: TdProps): JSX.Element => (
  <Td className={cssClasses('justify-center text-sm', className)}>—</Td>
)

const greenCheck = <CheckMarkSharp className="h-6 text-green-600" />

const validateOnSubmit = (
  password: ClearPassword,
  confirmPassword: string,
): Either<string, NotUsed> =>
  ClearPassword.unwrap(password) !== confirmPassword
    ? Either.left('Les mots de passe doivent être identiques')
    : pipe(validatePassword(password), Either.map(toNotUsed))
