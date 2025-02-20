import { json as fpTsJson, number, task } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import type { OptionsOfJSONResponseBody } from 'got'
import got, { HTTPError } from 'got'
import type { Decoder } from 'io-ts/Decoder'
import type { Encoder } from 'io-ts/Encoder'

import type { Method } from '../../shared/models/Method'
import type { NonEmptyArray } from '../../shared/utils/fp'
import { Dict, Either, Future, List, Maybe, Try, Tuple } from '../../shared/utils/fp'
import { decodeError } from '../../shared/utils/ioTsUtils'

import type { LoggerGetter } from '../models/logger/LoggerGetter'
import { unknownToError } from '../utils/unknownToError'

export type HttpOptions<O, B> = Omit<OptionsOfJSONResponseBody, 'url' | 'method' | 'json'> & {
  json?: Tuple<Encoder<O, B>, B>
}

type HttpClient = ReturnType<typeof HttpClient>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const HttpClient = (Logger: LoggerGetter) => {
  const logger = Logger('HttpClient')

  function json<O, B>(
    urlWithMethod: Tuple<string, Method>,
    options?: HttpOptions<O, B>,
  ): Future<unknown>
  function json<A, O, B>(
    urlWithMethod: Tuple<string, Method>,
    options: HttpOptions<O, B>,
    decoderWithName: Tuple<Decoder<unknown, A>, string>,
  ): Future<A>
  function json<A, O, B>(
    urlWithMethod: Tuple<string, Method>,
    options?: HttpOptions<O, B>,
    decoderWithName?: Tuple<Decoder<unknown, A>, string>,
  ): Future<A> {
    return pipe(
      text(urlWithMethod, options),
      Future.chainEitherK(flow(fpTsJson.parse, Either.mapLeft(unknownToError))),
      Future.chainEitherK(u => {
        if (decoderWithName === undefined) return Either.right(u as A)
        const [decoder, decoderName] = decoderWithName
        return pipe(decoder.decode(u), Either.mapLeft(decodeError(decoderName)(u)))
      }),
    )
  }

  const text = <O, B>(
    [url, method]: Tuple<string, Method>,
    options: HttpOptions<O, B> = {},
  ): Future<string> => {
    const json_ = ((): O | undefined => {
      if (options.json === undefined) return undefined
      const [encoder, b] = options.json
      return encoder.encode(b)
    })()

    return pipe(
      Future.tryCatch(() =>
        got[method](url, {
          ...options,
          method,
          json: json_ === undefined ? undefined : (json_ as Dict<string, unknown>),
        }),
      ),
      task.chainFirstIOK(
        flow(
          Try.fold(
            e => (e instanceof HTTPError ? Maybe.some(e.response.statusCode) : Maybe.none),
            res => Maybe.some(res.statusCode),
          ),
          Maybe.getOrElseW(() => '???' as const),
          formatRequest(method, url, options.searchParams),
          logger.debug,
        ),
      ),
      Future.map(res => res.body as string),
    )
  }

  return { json, text }
}

export const statusesToOption = (
  ...statuses: NonEmptyArray<number>
): (<A>(fa: Future<A>) => Future<Maybe<A>>) =>
  flow(
    Future.map(Maybe.some),
    Future.orElseEitherK(e =>
      e instanceof HTTPError && pipe(statuses, List.elem(number.Eq)(e.response.statusCode))
        ? Try.success(Maybe.none)
        : Try.failure(e),
    ),
  )

export { HttpClient }

const formatRequest =
  (method: Method, url: string, searchParams: HttpOptions<unknown, unknown>['searchParams']) =>
  (statusCode: number | '???'): string => {
    const search = searchParamsToString(searchParams)

    return `${method.toUpperCase()} ${url}${search !== undefined ? `?${search}` : ''} - ${statusCode}`
  }

function searchParamsToString(
  searchParams: HttpOptions<unknown, unknown>['searchParams'],
): string | undefined {
  if (searchParams === undefined) {
    return undefined
  }

  if (typeof searchParams === 'string') {
    return searchParams
  }

  if (isSearchParams(searchParams)) {
    return searchParams.toString()
  }

  return new URLSearchParams(
    pipe(
      Dict.toReadonlyArray(searchParams),
      List.map(([key, val]) => Tuple.of(key, `${val}`)),
      List.asMutable,
    ),
  ).toString()
}

function isSearchParams(a: unknown): a is URLSearchParams {
  return a instanceof URLSearchParams
}
