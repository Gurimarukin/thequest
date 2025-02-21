import { number } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import type { Decoder } from 'io-ts/Decoder'
import type { Encoder } from 'io-ts/Encoder'
import ky, { HTTPError } from 'ky'
import type { HttpMethod, Options } from 'ky/distribution/types/options'
import type { Except, OverrideProperties } from 'type-fest'

import { MsDuration } from '../../shared/models/MsDuration'
import type { NonEmptyArray, Tuple } from '../../shared/utils/fp'
import { Either, Future, List, Maybe, Try } from '../../shared/utils/fp'
import { decodeError } from '../../shared/utils/ioTsUtils'

import { config } from '../config/unsafe'

export type HttpOptions<O, B> = OverrideProperties<
  Except<Options, 'method'>,
  {
    json?: Tuple<Encoder<O, B>, B>
    timeout?: MsDuration
  }
>

function http<O, B>(
  urlWithMethod: Tuple<string, HttpMethod>,
  options?: HttpOptions<O, B>,
): Future<unknown>
function http<A, O, B>(
  urlWithMethod: Tuple<string, HttpMethod>,
  options: HttpOptions<O, B>,
  decoderWithName: Tuple<Decoder<unknown, A>, string>,
): Future<A>
function http<A, O, B>(
  [url, method]: Tuple<string, HttpMethod>,
  { credentials, timeout, ...options }: HttpOptions<O, B> = {},
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
        credentials: credentials ?? 'include',
        ...(timeout === undefined ? {} : { timeout: MsDuration.unwrap(timeout) }),
      }).json(),
    ),
    Future.chainEitherK(u => {
      if (decoderWithName === undefined) return Either.right(u as A)
      const [decoder, decoderName] = decoderWithName
      return pipe(decoder.decode(u), Either.mapLeft(decodeError(decoderName)(u)))
    }),
  )
}

const statusesToOption = (
  ...statuses: NonEmptyArray<number>
): (<A>(fa: Future<A>) => Future<Maybe<A>>) =>
  flow(
    Future.map(Maybe.some),
    Future.orElseEitherK(e =>
      e instanceof HTTPError && pipe(statuses, List.elem(number.Eq)(e.response.status))
        ? Try.success(Maybe.none)
        : Try.failure(e),
    ),
  )

export { http, statusesToOption }
