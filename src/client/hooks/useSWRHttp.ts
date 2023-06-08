import type { Decoder } from 'io-ts/Decoder'
import type { HttpMethod } from 'ky/distribution/types/options'
import type { BareFetcher, SWRConfiguration, SWRResponse } from 'swr'
import useSWR from 'swr'

import type { Tuple } from '../../shared/utils/fp'

import { config } from '../config/unsafe'
import { futureRunUnsafe } from '../utils/futureRunUnsafe'
import type { HttpOptions } from '../utils/http'
import { http } from '../utils/http'

// only changes of method and url will trigger revalidation
export const useSWRHttp = <A, O, B>(
  methodWithUrl: Tuple<string, HttpMethod>,
  httpOptions: Omit<HttpOptions<O, B>, 'redirectOnUnauthorized'>,
  decoderWithName: Tuple<Decoder<unknown, A>, string>,
  swrOptions?: SWRConfiguration<A, unknown, BareFetcher<A>>,
): SWRResponse<A, unknown> =>
  useSWR<A, unknown, Tuple<string, HttpMethod>>(
    methodWithUrl,
    methodWithUrl_ => futureRunUnsafe(http(methodWithUrl_, { ...httpOptions }, decoderWithName)),
    {
      ...swrOptions,
      revalidateIfStale: swrOptions?.revalidateIfStale ?? !config.isDev,
      revalidateOnFocus: swrOptions?.revalidateOnFocus ?? !config.isDev,
      revalidateOnReconnect: swrOptions?.revalidateOnReconnect ?? !config.isDev,
    },
  )
