import { json } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import type { OptionsOfJSONResponseBody } from 'got'
import got from 'got'
import type { Decoder } from 'io-ts/Decoder'
import type { Encoder } from 'io-ts/Encoder'

import type { Method } from '../../shared/models/Method'
import type { Tuple } from '../../shared/utils/fp'
import { Either, Future } from '../../shared/utils/fp'
import { decodeError } from '../../shared/utils/ioTsUtils'

import type { LoggerGetter } from '../models/logger/LoggerGetter'
import { unknownToError } from '../utils/unknownToError'

export type HttpOptions<O, B> = Omit<OptionsOfJSONResponseBody, 'url' | 'method' | 'json'> & {
  readonly json?: Tuple<Encoder<O, B>, B>
}

type HttpClient = ReturnType<typeof HttpClient>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const HttpClient = (Logger: LoggerGetter) => {
  const logger = Logger('HttpClient')

  function http<O, B>(
    methodWithUrl: Tuple<string, Method>,
    options?: HttpOptions<O, B>,
  ): Future<unknown>
  function http<A, O, B>(
    methodWithUrl: Tuple<string, Method>,
    options: HttpOptions<O, B>,
    decoderWithName: Tuple<Decoder<unknown, A>, string>,
  ): Future<A>
  function http<A, O, B>(
    [url, method]: Tuple<string, Method>,
    options: HttpOptions<O, B> = {},
    decoderWithName?: Tuple<Decoder<unknown, A>, string>,
  ): Future<A> {
    const body = ((): O | undefined => {
      if (options.json === undefined) return undefined
      const [encoder, b] = options.json
      return encoder.encode(b)
    })()

    return pipe(
      Future.tryCatch(() =>
        got[method](url, {
          ...options,
          method,
          body: body === undefined ? undefined : JSON.stringify(body),
        }),
      ),
      Future.chainFirstIOEitherK(res => logger.debug(formatRequest(method, url, res.statusCode))),

      Future.chainEitherK(res =>
        pipe(json.parse(res.body as string), Either.mapLeft(unknownToError)),
      ),
      Future.chainEitherK(u => {
        if (decoderWithName === undefined) return Either.right(u as A)
        const [decoder, decoderName] = decoderWithName
        return pipe(decoder.decode(u), Either.mapLeft(decodeError(decoderName)(u)))
      }),
    )
  }

  return { http }
}

export { HttpClient }

const formatRequest = (method: Method, url: string, status: number): string =>
  `${method.toUpperCase()} ${url} ${status}`
