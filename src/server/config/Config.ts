import type * as dotenv from 'dotenv'
import { pipe } from 'fp-ts/function'
import * as D from 'io-ts/Decoder'
import { lens } from 'monocle-ts'

import { ValidatedNea } from '../../shared/models/ValidatedNea'
import { DiscordUserId } from '../../shared/models/discord/DiscordUserId'
import { LogLevelOrOff } from '../../shared/models/logger/LogLevel'
import { loadDotEnv } from '../../shared/utils/config/loadDotEnv'
import { parseConfig } from '../../shared/utils/config/parseConfig'
import type { List, NonEmptyArray, Try } from '../../shared/utils/fp'
import { Either, IO, Maybe } from '../../shared/utils/fp'
import {
  ArrayFromString,
  BooleanFromString,
  NonEmptyArrayFromString,
  NumberFromString,
  URLFromString,
} from '../../shared/utils/ioTsUtils'

import { ClientSecret } from '../models/discord/ClientSecret'

const seqS = ValidatedNea.getSeqS<string>()

export type Config = {
  readonly isDev: boolean
  readonly logLevel: LogLevelOrOff
  readonly client: ClientConfig
  readonly http: HttpConfig
  readonly db: DbConfig
  readonly riotApiKey: string
  readonly jwtSecret: string
  readonly madosayentisuto: MadosayentisutoConfig
}

export type ClientConfig = {
  readonly id: DiscordUserId
  readonly secret: ClientSecret
  readonly redirectUri: string
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

export type MadosayentisutoConfig = {
  readonly whitelistedIps: List<string>
  readonly token: string
}

const parse = (dict: dotenv.DotenvParseOutput): Try<Config> =>
  parseConfig(dict)(r =>
    seqS<Config>({
      isDev: pipe(
        r(Maybe.decoder(BooleanFromString.decoder))('IS_DEV'),
        Either.map(Maybe.getOrElseW(() => false)),
      ),
      logLevel: r(LogLevelOrOff.codec)('LOG_LEVEL'),
      client: seqS<ClientConfig>({
        id: r(DiscordUserId.codec)('CLIENT_ID'),
        secret: r(ClientSecret.codec)('CLIENT_SECRET'),
        redirectUri: r(D.string)('REDIRECT_URI'),
      }),
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
      madosayentisuto: seqS<MadosayentisutoConfig>({
        whitelistedIps: r(ArrayFromString.decoder(D.string))('MADOSAYENTISUTO_WHITELISTED_IPS'),
        token: r(D.string)('MADOSAYENTISUTO_TOKEN'),
      }),
    }),
  )

const load: IO<Config> = pipe(loadDotEnv, IO.map(parse), IO.chain(IO.fromEither))

const Lens = {
  logLevel: pipe(lens.id<Config>(), lens.prop('logLevel')),
}

export const Config = { load, Lens }
