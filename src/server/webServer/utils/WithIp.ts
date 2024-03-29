import { apply } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { Status } from 'hyper-ts'

import { Maybe, Tuple } from '../../../shared/utils/fp'
import { NonEmptyString } from '../../../shared/utils/ioTsUtils'

import type { Config } from '../../config/Config'
import type { LoggerGetter } from '../../models/logger/LoggerGetter'
import type { EndedMiddleware } from '../models/MyMiddleware'
import { MyMiddleware as M } from '../models/MyMiddleware'

type WithIp = (cause: string) => (f: (ip: string) => EndedMiddleware) => EndedMiddleware

const maybeStr = Tuple.of(Maybe.decoder(NonEmptyString.codec), 'Maybe<NonEmptyString>')

const WithIp = (Logger: LoggerGetter, config: Config): WithIp => {
  const logger = Logger('WithIp')

  return cause => f =>
    pipe(
      apply.sequenceS(M.ApplyPar)({
        xForwardedFor: M.decodeHeader('x-forwarded-for', maybeStr),
        remoteAddress: M.decodeHeader('remote-address', maybeStr),
        xRealIp: M.decodeHeader('x-real-ip', maybeStr),
      }),
      M.matchE(
        () => M.sendWithStatus(Status.BadRequest)(''),
        ({ xForwardedFor, remoteAddress, xRealIp }) =>
          pipe(
            xForwardedFor,
            Maybe.alt(() => remoteAddress),
            Maybe.alt(() => xRealIp),
            Maybe.alt(() => (config.isDev ? Maybe.some('127.0.0.1') : Maybe.none)),
            Maybe.fold(
              () =>
                pipe(
                  logger.error(`Request rejected because ip is required for ${cause}`),
                  M.fromIOEither,
                  M.ichain(() => M.sendWithStatus(Status.BadRequest)('')),
                ),
              ip => f(ip),
            ),
          ),
      ),
    )
}

export { WithIp }
