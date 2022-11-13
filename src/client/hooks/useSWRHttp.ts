import type { Decoder } from 'io-ts/Decoder'
import type { HttpMethod } from 'ky/distribution/types/options'
import type { BareFetcher, SWRConfiguration, SWRResponse } from 'swr'
import useSWR from 'swr'

import type { Tuple, Tuple3 } from '../../shared/utils/fp'
import { Future } from '../../shared/utils/fp'

import type { HttpOptions } from '../utils/http'
import { http } from '../utils/http'

// only changes of method and url will trigger revalidation
export const useSWRHttp = <A, O, B>(
  methodWithUrl: Tuple<string, HttpMethod>,
  httpOptions: Omit<HttpOptions<O, B>, 'redirectOnUnauthorized'>,
  decoderWithName: Tuple<Decoder<unknown, A>, string>,
  swrOptions?: SWRConfiguration<A, unknown, BareFetcher<A>>,
): SWRResponse<A, unknown> =>
  useSWR<A, unknown, Tuple3<string, HttpMethod, typeof http>>(
    [...methodWithUrl, http],
    (method, url, http_) =>
      Future.runUnsafe(http_([method, url], { ...httpOptions }, decoderWithName)),
    swrOptions,
  )
