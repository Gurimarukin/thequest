import { apply } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import * as D from 'io-ts/Decoder'
import useSWR from 'swr'

import type { RouteWithMethod } from '../../../shared/ApiRouter'
import { apiRoutes } from '../../../shared/ApiRouter'
import { MsDuration } from '../../../shared/models/MsDuration'
import { DiscordCodePayload } from '../../../shared/models/api/user/DiscordCodePayload'
import { OAuth2Code } from '../../../shared/models/discord/OAuth2Code'
import type { Dict } from '../../../shared/utils/fp'
import { Either, Future } from '../../../shared/utils/fp'

import { AsyncRenderer } from '../../components/AsyncRenderer'
import { Link } from '../../components/Link'
import { Navigate } from '../../components/Navigate'
import { useHistory } from '../../contexts/HistoryContext'
import { useTranslation } from '../../contexts/TranslationContext'
import { useUser } from '../../contexts/UserContext'
import { appRoutes } from '../../router/AppRouter'
import { futureRunUnsafe } from '../../utils/futureRunUnsafe'
import { http } from '../../utils/http'
import { NotFound } from '../NotFound'
import { DiscordRedirectState } from './DiscordRedirectState'

const apiCallDelay = MsDuration.milliseconds(100)

const apiRoute: Dict<DiscordRedirectState, RouteWithMethod> = {
  login: apiRoutes.user.login.discord.post,
  register: apiRoutes.user.register.discord.post,
}

const codeDecoder = D.struct({
  code: OAuth2Code.codec,
  state: DiscordRedirectState.decoder,
})

export const DiscordRedirect: React.FC = () => {
  const { query } = useHistory()

  return pipe(
    codeDecoder.decode(query),
    Either.fold(
      () => <NotFound />,
      ({ code, state }) => <DiscordRedirectValidated code={code} state={state} />,
    ),
  )
}

type DiscordRedirectValidatedProps = {
  code: OAuth2Code
  state: DiscordRedirectState
}

const DiscordRedirectValidated: React.FC<DiscordRedirectValidatedProps> = ({ code, state }) => {
  const { refreshUser } = useUser()
  const { t } = useTranslation('common')

  const { data, error } = useSWR(
    [...apiRoute[state], code],
    ([url, method, code_]) =>
      pipe(
        apply.sequenceT(Future.ApplyPar)(
          pipe(
            http([url, method], { json: [DiscordCodePayload.codec, { code: code_ }] }),
            Future.chain(() => refreshUser),
          ),
          pipe(Future.notUsed, Future.delay(apiCallDelay)),
        ),
        futureRunUnsafe,
      ),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
    },
  )

  return (
    <>
      <pre>{JSON.stringify({ data, error })}</pre>
      <AsyncRenderer data={data} error={error}>
        {() => <Navigate to={appRoutes.index} replace={true} />}
      </AsyncRenderer>
      {error !== undefined ? (
        <div className="flex justify-center">
          <Link to={appRoutes.index} className="mt-4 underline">
            {t.layout.home}
          </Link>
        </div>
      ) : null}
    </>
  )
}
