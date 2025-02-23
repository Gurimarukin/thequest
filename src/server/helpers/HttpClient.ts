import { json as fpTsJson, number, task } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import type { Decoder } from 'io-ts/Decoder'
import type { Encoder } from 'io-ts/Encoder'
import type { Options as KyOptions, SearchParamsOption } from 'ky'
import ky, { HTTPError as KyHTTPError } from 'ky'
import type { Except, Merge } from 'type-fest'

import type { Method } from '../../shared/models/Method'
import type { NonEmptyArray } from '../../shared/utils/fp'
import { Dict, Either, Future, List, Maybe, Try, Tuple } from '../../shared/utils/fp'
import { decodeError } from '../../shared/utils/ioTsUtils'

import type { LoggerGetter } from '../models/logger/LoggerGetter'
import { unknownToError } from '../utils/unknownToError'

type BaseOptions = Except<KyOptions, 'method' | 'body' | 'json'>
type BodyOptions = Merge<BaseOptions, { body: BodyInit }>
type FormOptions = Merge<BaseOptions, { form: Dict<string, string> }>
type JsonOptions<O, B> = Merge<BaseOptions, { json: Tuple<Encoder<O, B>, B> }>

export type HttpOptions<O, B> = BaseOptions | BodyOptions | JsonOptions<O, B> | FormOptions

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
        if (decoderWithName === undefined) {
          return Either.right(u as A)
        }

        const [decoder, decoderName] = decoderWithName

        return pipe(decoder.decode(u), Either.mapLeft(decodeError(decoderName)(u)))
      }),
    )
  }

  function text<O, B>(
    [url, method]: Tuple<string, Method>,
    options: HttpOptions<O, B> = {},
  ): Future<string> {
    const body = ((): BodyInit | undefined => {
      if ('body' in options) {
        return options.body
      }

      if (!('form' in options)) {
        return undefined
      }

      const formData = new FormData()

      // eslint-disable-next-line functional/no-loop-statements
      for (const [key, val] of Dict.toReadonlyArray(options.form)) {
        // eslint-disable-next-line functional/no-expression-statements
        formData.append(key, val)
      }

      return formData
    })()

    const json_ = ((): O | undefined => {
      if (!('json' in options)) {
        return undefined
      }

      const [encoder, b] = options.json

      return encoder.encode(b)
    })()

    return pipe(
      Future.tryCatch(() =>
        ky[method](url, {
          ...options,
          method,
          body: body ?? undefined,
          json: json_ === undefined ? undefined : (json_ as Dict<string, unknown>),
        }),
      ),
      task.chainFirstIOK(
        flow(
          Try.fold(
            e => (e instanceof KyHTTPError ? Maybe.some(e.response.status) : Maybe.none),
            res => Maybe.some(res.status),
          ),
          Maybe.getOrElseW(() => '???' as const),
          formatRequest(method, url, options.searchParams),
          logger.debug,
        ),
      ),
      Future.chain(res => Future.tryCatch(() => res.text())),
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
      e instanceof KyHTTPError && pipe(statuses, List.elem(number.Eq)(e.response.status))
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

function searchParamsToString(searchParams: SearchParamsOption): string | undefined {
  if (searchParams === undefined) {
    return undefined
  }

  if (typeof searchParams === 'string') {
    return searchParams
  }

  if (isSearchParams(searchParams)) {
    return searchParams.toString()
  }

  const as: List<List<string | number | boolean>> = Array.isArray(searchParams)
    ? searchParams
    : Dict.toReadonlyArray(searchParams)

  return new URLSearchParams(
    pipe(
      as,
      List.map(([key, val]) => Tuple.of(`${key}`, `${val}`)),
      List.asMutable,
    ),
  ).toString()
}

function isSearchParams(a: unknown): a is URLSearchParams {
  return a instanceof URLSearchParams
}
