import type * as dotenv from 'dotenv'
import { pipe } from 'fp-ts/function'
import * as D from 'io-ts/Decoder'
import { lens } from 'monocle-ts'

import { ValidatedNea } from '../../shared/models/ValidatedNea'
import { LogLevelOrOff } from '../../shared/models/logger/LogLevel'
import { loadDotEnv } from '../../shared/utils/config/loadDotEnv'
import { parseConfig } from '../../shared/utils/config/parseConfig'
import type { NonEmptyArray, Try } from '../../shared/utils/fp'
import { Either, IO, Maybe } from '../../shared/utils/fp'
import {
  BooleanFromString,
  NonEmptyArrayFromString,
  NumberFromString,
  URLFromString,
} from '../../shared/utils/ioTsUtils'

const seqS = ValidatedNea.getSeqS<string>()

export type Config = {
  readonly isDev: boolean
  readonly logLevel: LogLevelOrOff
  readonly http: HttpConfig
  readonly db: DbConfig
  readonly riotApiKey: string
  readonly jwtSecret: string
}

export type HttpConfig = {
  readonly port: number
  readonly allowedOrigins: Maybe<NonEmptyArray<URL>>
}

type DbConfig = {
  readonly host: string
  readonly dbName: string
  readonly user: string
  readonly password: string
}

const parse = (dict: dotenv.DotenvParseOutput): Try<Config> =>
  parseConfig(dict)(r =>
    seqS<Config>({
      isDev: pipe(
        r(Maybe.decoder(BooleanFromString.decoder))('IS_DEV'),
        Either.map(Maybe.getOrElseW(() => false)),
      ),
      logLevel: r(LogLevelOrOff.codec)('LOG_LEVEL'),
      http: seqS<HttpConfig>({
        port: r(NumberFromString.decoder)('HTTP_PORT'),
        allowedOrigins: r(Maybe.decoder(NonEmptyArrayFromString.decoder(URLFromString.decoder)))(
          'HTTP_ALLOWED_ORIGINS',
        ),
      }),
      db: seqS<DbConfig>({
        host: r(D.string)('DB_HOST'),
        dbName: r(D.string)('DB_NAME'),
        user: r(D.string)('DB_USER'),
        password: r(D.string)('DB_PASSWORD'),
      }),
      riotApiKey: r(D.string)('RIOT_API_KEY'),
      jwtSecret: r(D.string)('JWT_SECRET'),
    }),
  )

const load: IO<Config> = pipe(loadDotEnv, IO.map(parse), IO.chain(IO.fromEither))

const Lens = {
  logLevel: pipe(lens.id<Config>(), lens.prop('logLevel')),
}

export const Config = { load, Lens }
