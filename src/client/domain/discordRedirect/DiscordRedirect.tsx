/* eslint-disable functional/no-expression-statements */
import { pipe } from 'fp-ts/function'
import * as D from 'io-ts/Decoder'
import React, { useEffect } from 'react'
import useSWR from 'swr'

import type { RouteWithMethod } from '../../../shared/ApiRouter'
import { apiRoutes } from '../../../shared/ApiRouter'
import { DiscordCodePayload } from '../../../shared/models/api/user/DiscordCodePayload'
import { OAuth2Code } from '../../../shared/models/discord/OAuth2Code'
import type { Dict } from '../../../shared/utils/fp'
import { Either } from '../../../shared/utils/fp'

import { Link } from '../../components/Link'
import { useHistory } from '../../contexts/HistoryContext'
import { useUser } from '../../contexts/UserContext'
import { appRoutes } from '../../router/AppRouter'
import { basicAsyncRenderer } from '../../utils/basicAsyncRenderer'
import { futureRunUnsafe } from '../../utils/futureRunUnsafe'
import { http } from '../../utils/http'
import { NotFound } from '../NotFound'
import { DiscordRedirectState } from './DiscordRedirectState'

const codeDecoder = D.struct({
  code: OAuth2Code.codec,
  state: DiscordRedirectState.decoder,
})

export const DiscordRedirect = (): JSX.Element => {
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

const DiscordRedirectValidated = ({ code, state }: DiscordRedirectValidatedProps): JSX.Element => {
  const { navigate } = useHistory()
  const { refreshUser } = useUser()

  const { data, error } = useSWR(
    [...apiRoute[state], code],
    ([url, method, code_]) =>
      pipe(
        http([url, method], { json: [DiscordCodePayload.codec, { code: code_ }] }),
        futureRunUnsafe,
      ),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
    },
  )

  useEffect(() => {
    if (data !== undefined) {
      refreshUser()
      navigate(appRoutes.index, { replace: true })
    }
  }, [data, navigate, refreshUser])

  return (
    <>
      {basicAsyncRenderer({ data, error })(() => null)}
      {error !== undefined ? (
        <div className="flex justify-center">
          <Link to={appRoutes.index} className="mt-4 underline">
            Accueil
          </Link>
        </div>
      ) : null}
    </>
  )
}

const apiRoute: Dict<DiscordRedirectState, RouteWithMethod> = {
  login: apiRoutes.user.login.discord.post,
  register: apiRoutes.user.register.discord.post,
}
