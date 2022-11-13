import * as D from 'io-ts/Decoder'
import React from 'react'

import { apiRoutes } from '../../shared/ApiRouter'
import type { Platform } from '../../shared/models/Platform'

import { useSWRHttp } from '../hooks/useSWRHttp'
import { basicAsyncRenderer } from '../utils/basicAsyncRenderer'

type Props = {
  readonly platform: Platform
  readonly summonerName: string
}

export const Summoner = ({ platform, summonerName }: Props): JSX.Element => (
  <div className="flex justify-center">
    {basicAsyncRenderer(
      useSWRHttp(apiRoutes.platform.summoner.byName.get(platform, summonerName), {}, [
        D.id<unknown>(),
        'unknown',
      ]),
    )(u => (
      <pre className="w-full p-6">{JSON.stringify(u, null, 2)}</pre>
    ))}
  </div>
)
