import { apply } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import * as D from 'io-ts/Decoder'
import useSWR from 'swr'

import { apiRoutes } from '../../shared/ApiRouter'
import { MsDuration } from '../../shared/models/MsDuration'
import { DiscordCodePayload } from '../../shared/models/api/user/DiscordCodePayload'
import { OAuth2Code } from '../../shared/models/discord/OAuth2Code'
import { Either, Future } from '../../shared/utils/fp'

import { AsyncRenderer } from '../components/AsyncRenderer'
import { Link } from '../components/Link'
import { Navigate } from '../components/Navigate'
import { useHistory } from '../contexts/HistoryContext'
import { useTranslation } from '../contexts/TranslationContext'
import { useUser } from '../contexts/UserContext'
import { appRoutes } from '../router/AppRouter'
import { futureRunUnsafe } from '../utils/futureRunUnsafe'
import { http } from '../utils/http'
import { NotFound } from './NotFound'

const apiCallDelay = MsDuration.milliseconds(100)

const apiRoute = apiRoutes.user.login.discord.post

const codeDecoder = D.struct({
  code: OAuth2Code.codec,
})

export const DiscordRedirect: React.FC = () => {
  const { query } = useHistory()

  return pipe(
    codeDecoder.decode(query),
    Either.fold(
      () => <NotFound />,
      ({ code }) => <DiscordRedirectValidated code={code} />,
    ),
  )
}

type DiscordRedirectValidatedProps = {
  code: OAuth2Code
}

const DiscordRedirectValidated: React.FC<DiscordRedirectValidatedProps> = ({ code }) => {
  const { refreshUser } = useUser()
  const { t } = useTranslation('common')

  const { data, error } = useSWR(
    [...apiRoute, code],
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
