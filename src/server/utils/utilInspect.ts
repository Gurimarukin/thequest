/* eslint-disable functional/no-expression-statements,
                  functional/no-this-expressions */
import { string } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { HTTPError as KyHTTPError } from 'ky'
import type { InspectOptions } from 'util'
import util from 'util'

import { List, NonEmptyArray } from '../../shared/utils/fp'

export const utilInspect = (object: unknown, options?: InspectOptions): string =>
  util.inspect(customHandlers(object), options)

export const utilFormat = (format?: unknown, ...param: unknown[]): string =>
  util.format(customHandlers(format), ...param.map(customHandlers))

const customHandlers = (object: unknown): unknown =>
  object instanceof KyHTTPError ? MyHttpError.fromHTTPError(object) : object

// eslint-disable-next-line functional/no-classes, functional/no-class-inheritance
class MyHttpError extends Error {
  responseBody: string | undefined

  private constructor(
    stack: string | undefined,
    method: string,
    url: string,
    status: number | undefined,
    responseBody?: Buffer | string,
  ) {
    super(`MyHttpError: ${method.toUpperCase()} ${url} - ${status ?? '???'}`)

    this.name = 'MyHttpError'

    if (stack !== undefined) {
      this.stack = pipe(
        stack,
        string.split('\n'),
        NonEmptyArray.tail,
        List.prepend(this.message),
        List.mkString('\n'),
      )
    }

    this.responseBody = responseBody?.toString('utf-8')
  }

  static fromHTTPError(e: KyHTTPError): MyHttpError {
    return new MyHttpError(e.stack, e.request.method, e.request.url, e.response.status)
  }
}
