import { pipe } from 'fp-ts/function'
import type { Decoder } from 'io-ts/Decoder'
import type { Encoder } from 'io-ts/Encoder'
import ky from 'ky'
import type { HttpMethod, Options } from 'ky/distribution/types/options'

import type { Tuple } from '../../shared/utils/fp'
import { Either, Future } from '../../shared/utils/fp'
import { decodeError } from '../../shared/utils/ioTsUtils'

import { config } from '../config/unsafe'

export type HttpOptions<O, B> = Omit<Options, 'method' | 'json'> & {
  readonly json?: Tuple<Encoder<O, B>, B>
}

function http<O, B>(
  methodWithUrl: Tuple<string, HttpMethod>,
  options?: HttpOptions<O, B>,
): Future<unknown>
function http<A, O, B>(
  methodWithUrl: Tuple<string, HttpMethod>,
  options: HttpOptions<O, B>,
  decoderWithName: Tuple<Decoder<unknown, A>, string>,
): Future<A>
function http<A, O, B>(
  [url, method]: Tuple<string, HttpMethod>,
  { credentials, ...options }: HttpOptions<O, B> = {},
  decoderWithName?: Tuple<Decoder<unknown, A>, string>,
): Future<A> {
  const json = ((): O | undefined => {
    if (options.json === undefined) return undefined
    const [encoder, b] = options.json
    return encoder.encode(b)
  })()

  return pipe(
    Future.tryCatch(() =>
      ky(new URL(url, config.apiHost), {
        ...options,
        method,
        json,
        credentials: credentials === undefined ? 'include' : credentials,
      }).json(),
    ),
    Future.chainEitherK(u => {
      if (decoderWithName === undefined) return Either.right(u as A)
      const [decoder, decoderName] = decoderWithName
      return pipe(decoder.decode(u), Either.mapLeft(decodeError(decoderName)(u)))
    }),
  )
}

export { http }
