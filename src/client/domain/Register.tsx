/* eslint-disable functional/no-expression-statements */
import { task } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import { lens } from 'monocle-ts'
import type React from 'react'
import { useCallback, useMemo, useState } from 'react'

import { ClearPassword } from '../../shared/models/api/user/ClearPassword'
import { LoginPasswordPayload } from '../../shared/models/api/user/LoginPasswordPayload'
import type { NotUsed } from '../../shared/utils/fp'
import { Either, Future, Maybe, toNotUsed } from '../../shared/utils/fp'
import { validatePassword } from '../../shared/validations/validatePassword'

import { apiUserRegisterPost } from '../api'
import { Link } from '../components/Link'
import { Loading } from '../components/Loading'
import { Navigate } from '../components/Navigate'
import { MainLayout } from '../components/mainLayout/MainLayout'
import { constants } from '../config/constants'
import { useHistory } from '../contexts/HistoryContext'
import type { Translation } from '../contexts/TranslationContext'
import { useTranslation } from '../contexts/TranslationContext'
import { useUser } from '../contexts/UserContext'
import { CheckMarkSharp } from '../imgs/svgIcons'
import { DiscordLogoTitle } from '../imgs/svgs/DiscordLogoTitle'
import { AsyncState } from '../models/AsyncState'
import type { ChildrenFC } from '../models/ChildrenFC'
import { appRoutes } from '../router/AppRouter'
import { basicAsyncRenderer } from '../utils/basicAsyncRenderer'
import { cx } from '../utils/cx'
import { discordApiOAuth2Authorize } from '../utils/discordApiOAuth2Authorize'
import { futureRunUnsafe } from '../utils/futureRunUnsafe'

const lesQuaisAbattoirs = {
  inviteLink: 'https://discord.gg/M4jnkHd',
  name: 'Les Quais-Abattoirs',
  image:
    'https://cdn.discordapp.com/icons/707621148652994642/a_8b2674e8d2831749f540f330df66a63e.gif?size=240',
}

type State = {
  userName: string
  password: string
  confirmPassword: string
}

const emptyState: State = { userName: '', password: '', confirmPassword: '' }

const userNameLens = pipe(lens.id<State>(), lens.prop('userName'))
const passwordLens = pipe(lens.id<State>(), lens.prop('password'))
const confirmPasswordLens = pipe(lens.id<State>(), lens.prop('confirmPassword'))

export const Register: React.FC = () => {
  const { navigate } = useHistory()
  const { user } = useUser()
  const { t } = useTranslation()

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
            validateOnSubmit(t.form)(payload.password, state.confirmPassword),
            Either.foldW(flow(Maybe.some, setError), () => {
              setIsLoading(true)
              return pipe(
                apiUserRegisterPost(payload),
                Future.map(() => navigate(appRoutes.login)),
                Future.orElse(() => Future.successful(setError(Maybe.some('error')))),
                task.chainFirstIOK(() => () => setIsLoading(false)),
                futureRunUnsafe,
              )
            }),
          )
        }),
      )
    },
    [navigate, state.confirmPassword, t.form, validated],
  )

  return basicAsyncRenderer(AsyncState.toSWR(user))(
    Maybe.fold(
      () => (
        <MainLayout>
          <div className="flex flex-col items-center gap-12 px-4 py-20">
            <p className="leading-8">{t.register.registrationExplanation}</p>
            <table className="grid grid-cols-[auto_repeat(3,1fr)]">
              <thead className="contents">
                <tr className="contents">
                  <th />
                  <Th>{t.register.withoutAccount}</Th>
                  <Th>{t.register.withAccountNotLinked}</Th>
                  <Th>{t.register.withAccountLinked}</Th>
                </tr>
              </thead>
              <tbody className="contents">
                <tr className="contents">
                  <Td className="border-l border-t border-goldenrod pl-6 pt-12">
                    {t.register.accessSummonerDetails}
                  </Td>
                  <Td className="justify-center border-t border-goldenrod pt-12">{greenCheck}</Td>
                  <Td className="justify-center border-t border-goldenrod pt-12">{greenCheck}</Td>
                  <Td className="justify-center border-r border-t border-goldenrod pt-12">
                    {greenCheck}
                  </Td>
                </tr>
                <tr className="contents">
                  <Td className="border-l border-goldenrod pl-6">
                    {t.register.accessRecentSearches(constants.recentSearchesMaxCount)}
                  </Td>
                  <Td className="justify-center">{greenCheck}</Td>
                  <Td className="justify-center">{greenCheck}</Td>
                  <Td className="justify-center border-r border-goldenrod">{greenCheck}</Td>
                </tr>
                <tr className="contents">
                  <Td className="border-l border-goldenrod pl-6">
                    {t.register.addSummonerToFavorites}
                  </Td>
                  <EmptyTd />
                  <Td className="justify-center">{greenCheck}</Td>
                  <Td className="justify-center border-r border-goldenrod">{greenCheck}</Td>
                </tr>
                <tr className="contents">
                  <Td className="border-l border-goldenrod pl-6">{t.register.keepTrackOfShards}</Td>
                  <EmptyTd />
                  <Td className="justify-center">{greenCheck}</Td>
                  <Td className="justify-center border-r border-goldenrod">{greenCheck}</Td>
                </tr>
                <tr className="contents">
                  <Td className="border-l border-goldenrod pl-6">
                    {t.register.customiseChampionPositions}
                  </Td>
                  <EmptyTd />
                  <Td className="justify-center">{greenCheck}</Td>
                  <Td className="justify-center border-r border-goldenrod">{greenCheck}</Td>
                </tr>
                <tr className="contents">
                  <Td className="border-l border-goldenrod pl-6">
                    {t.register.quickSummonerAccess}
                  </Td>
                  <EmptyTd />
                  <EmptyTd />
                  <Td className="justify-center border-r border-goldenrod">{greenCheck}</Td>
                </tr>
                <tr className="contents">
                  <Td className="flex-col gap-3 border-b border-l border-goldenrod pb-12 pl-6">
                    <span className="self-start">{t.register.discordHallOfFameRanking}</span>
                    <div className="flex items-center self-start rounded bg-discord-darkgrey px-6 py-5 font-[baloopaaji2] text-white">
                      <img
                        src={lesQuaisAbattoirs.image}
                        alt={t.register.discordServerIconAlt(lesQuaisAbattoirs.name)}
                        className="w-12 rounded-xl"
                      />
                      <span className="ml-4 flex flex-col">
                        <span className="font-bold">{lesQuaisAbattoirs.name}</span>
                        <span className="text-sm text-zinc-400">{t.register.discordServer}</span>
                      </span>
                      <a
                        href={lesQuaisAbattoirs.inviteLink}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-8 rounded bg-discord-darkgreen px-3 py-2 text-sm"
                      >
                        {t.register.join}
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
              {t.form.registerWithDiscord(<DiscordLogoTitle className="my-3 ml-3 h-6" />)}
            </a>

            <p>{t.form.or}</p>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col items-center gap-8 border border-goldenrod bg-zinc-900 px-12 py-8"
            >
              <div className="grid grid-cols-[auto_auto] gap-x-3 gap-y-2">
                <label className="contents">
                  <span>{t.form.userName}</span>
                  <input
                    type="text"
                    value={state.userName}
                    onChange={updateUserName}
                    className="border border-goldenrod bg-transparent"
                  />
                </label>
                <label className="contents">
                  <span>{t.form.password}</span>
                  <input
                    type="password"
                    value={state.password}
                    onChange={updatePassword}
                    className="border border-goldenrod bg-transparent"
                  />
                </label>
                <label className="contents">
                  <span>{t.form.confirmPassword}</span>
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
                  disabled={isLoading || Either.isLeft(validated)}
                  className="flex items-center gap-2 bg-goldenrod px-4 py-1 text-black enabled:hover:bg-goldenrod/75 disabled:bg-grey-disabled"
                >
                  <span>{t.form.register}</span>
                  {isLoading ? <Loading className="h-4" /> : null}
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
              <span>{t.form.alreadyAnAccount}</span>
              <Link to={appRoutes.login} className="underline">
                {t.form.login}
              </Link>
            </div>
          </div>
        </MainLayout>
      ),
      () => <Navigate to={appRoutes.index} replace={true} />,
    ),
  )
}

const Th: ChildrenFC = ({ children }) => (
  <th className="flex items-center justify-center px-2 pb-3 font-normal">{children}</th>
)

type TdProps = EmptyTdProps & {
  children?: React.ReactNode
}

const Td: React.FC<TdProps> = ({ className, children }) => (
  <td className={cx('flex items-center bg-zinc-900 px-2 py-5', className)}>{children}</td>
)

type EmptyTdProps = {
  className?: string
}

const EmptyTd: React.FC<EmptyTdProps> = ({ className }) => (
  <Td className={cx('justify-center text-sm', className)}>—</Td>
)

const greenCheck = <CheckMarkSharp className="h-6 text-green" />

const validateOnSubmit =
  (t: Translation['form']) =>
  (password: ClearPassword, confirmPassword: string): Either<string, NotUsed> =>
    ClearPassword.unwrap(password) !== confirmPassword
      ? Either.left(t.passwordsShouldBeIdentical)
      : pipe(validatePassword(password), Either.map(toNotUsed))
