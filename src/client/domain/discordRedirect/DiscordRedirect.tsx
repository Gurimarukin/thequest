import { pipe } from 'fp-ts/function'
import * as D from 'io-ts/Decoder'
import React from 'react'
import useSWR from 'swr'

import type { RouteWithMethod } from '../../../shared/ApiRouter'
import { apiRoutes } from '../../../shared/ApiRouter'
import { DiscordCodePayload } from '../../../shared/models/api/user/DiscordCodePayload'
import { OAuth2Code } from '../../../shared/models/discord/OAuth2Code'
import type { Dict } from '../../../shared/utils/fp'
import { Either } from '../../../shared/utils/fp'

import { useHistory } from '../../contexts/HistoryContext'
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
  readonly code: OAuth2Code
  readonly state: DiscordRedirectState
}

const DiscordRedirectValidated = ({ code, state }: DiscordRedirectValidatedProps): JSX.Element =>
  basicAsyncRenderer(
    useSWR(
      [...apiRoute[state], code],
      (url, method, code_) =>
        pipe(
          http([url, method], { json: [DiscordCodePayload.codec, { code: code_ }] }),
          futureRunUnsafe,
        ),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        shouldRetryOnError: false,
      },
    ),
  )(u => <pre>{JSON.stringify(u, null, 2)}</pre>)

const apiRoute: Dict<DiscordRedirectState, RouteWithMethod> = {
  login: apiRoutes.user.login.discord.post,
  register: apiRoutes.user.register.discord.post,
}
