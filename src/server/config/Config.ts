import { pipe } from 'fp-ts/function'
import * as D from 'io-ts/Decoder'
import { lens } from 'monocle-ts'

import { MsDuration } from '../../shared/models/MsDuration'
import { ValidatedNea } from '../../shared/models/ValidatedNea'
import { DiscordUserId } from '../../shared/models/discord/DiscordUserId'
import { LogLevelOrOff } from '../../shared/models/logger/LogLevel'
import { loadDotEnv } from '../../shared/utils/config/loadDotEnv'
import { parseConfig } from '../../shared/utils/config/parseConfig'
import type { List, NonEmptyArray, PartialDict, Try } from '../../shared/utils/fp'
import { Either, IO, Maybe } from '../../shared/utils/fp'
import {
  ArrayFromString,
  BooleanFromString,
  NonEmptyArrayFromString,
  NumberFromString,
  URLFromString,
} from '../../shared/utils/ioTsUtils'

import { ClientSecret } from '../models/discord/ClientSecret'

const separator = ','
const nonEmptyArrayFromStringDecoder = NonEmptyArrayFromString.decoder(separator)
const arrayFromStringDecoder = ArrayFromString.decoder(separator)

const seqS = ValidatedNea.getSeqS<string>()

export type Config = {
  isDev: boolean
  mock: boolean
  logLevel: LogLevelOrOff
  discordClient: DiscordClientConfig
  http: HttpConfig
  db: DbConfig
  riotApi: RiotApiConfig
  poroApi: PoroApiConfig
  jwtSecret: string
  madosayentisuto: MadosayentisutoConfig
}

export type DiscordClientConfig = {
  id: DiscordUserId
  secret: ClientSecret
  token: string
  redirectUri: string
}

export type HttpConfig = {
  port: number
  allowedOrigins: Maybe<NonEmptyArray<URL>>
}

export type DbConfig = {
  host: string
  dbName: string
  user: string
  password: string
}

type RiotApiConfig = {
  key: string
  cacheTtl: RiotApiCacheTtlConfig
}

export type PoroApiConfig = {
  baseUrl: string
  userAgent: string
  cacheTtlActiveGame: MsDuration
}

export type RiotApiCacheTtlConfig = {
  ddragonLatestVersion: MsDuration
  activeGame: MsDuration
  activeGameLoading: MsDuration // If the game is loading, cache it less longer
  challenges: MsDuration
  leagueEntries: MsDuration
  masteries: MsDuration
  summoner: MsDuration
  account: MsDuration
}

export type MadosayentisutoConfig = {
  guildId: string
  whitelistedIps: List<string>
  token: string
}

const parse = (dict: PartialDict<string, string>): Try<Config> =>
  parseConfig(dict)(r => {
    const infiniteCache = pipe(
      r(Maybe.decoder(BooleanFromString.decoder))('INFINITE_CACHE'),
      Either.map(Maybe.getOrElse(() => false)),
    )
    return seqS<Config>({
      isDev: pipe(
        r(Maybe.decoder(BooleanFromString.decoder))('IS_DEV'),
        Either.map(Maybe.getOrElse(() => false)),
      ),
      mock: pipe(
        r(Maybe.decoder(BooleanFromString.decoder))('MOCK'),
        Either.map(Maybe.getOrElse(() => false)),
      ),
      logLevel: r(LogLevelOrOff.codec)('LOG_LEVEL'),
      discordClient: seqS<DiscordClientConfig>({
        id: r(DiscordUserId.codec)('DISCORD_CLIENT_ID'),
        secret: r(ClientSecret.codec)('DISCORD_CLIENT_SECRET'),
        token: r(D.string)('DISCORD_CLIENT_TOKEN'),
        redirectUri: r(D.string)('DISCORD_CLIENT_REDIRECT_URI'),
      }),
      http: seqS<HttpConfig>({
        port: r(NumberFromString.decoder)('HTTP_PORT'),
        allowedOrigins: r(Maybe.decoder(nonEmptyArrayFromStringDecoder(URLFromString.decoder)))(
          'HTTP_ALLOWED_ORIGINS',
        ),
      }),
      db: seqS<DbConfig>({
        host: r(D.string)('DB_HOST'),
        dbName: r(D.string)('DB_NAME'),
        user: r(D.string)('DB_USER'),
        password: r(D.string)('DB_PASSWORD'),
      }),
      riotApi: seqS<RiotApiConfig>({
        key: r(D.string)('RIOT_API_KEY'),
        cacheTtl: pipe(infiniteCache, Either.map(riotApiCacheTtl)),
      }),
      poroApi: seqS<PoroApiConfig>({
        baseUrl: r(D.string)('PORO_BASE_URL'),
        userAgent: r(D.string)('PORO_USER_AGENT'),
        cacheTtlActiveGame: pipe(
          infiniteCache,
          Either.map(i => (i ? infinity : MsDuration.hour(1))),
        ),
      }),
      jwtSecret: r(D.string)('JWT_SECRET'),
      madosayentisuto: seqS<MadosayentisutoConfig>({
        guildId: r(D.string)('MADOSAYENTISUTO_GUILD_ID'),
        whitelistedIps: r(arrayFromStringDecoder(D.string))('MADOSAYENTISUTO_WHITELISTED_IPS'),
        token: r(D.string)('MADOSAYENTISUTO_TOKEN'),
      }),
    })
  })

const infinity = MsDuration.days(99 * 365)

const riotApiCacheTtl = (infiniteCache: boolean): RiotApiCacheTtlConfig => ({
  ddragonLatestVersion: infiniteCache ? infinity : MsDuration.hour(1),

  account: infiniteCache ? infinity : MsDuration.hours(3),
  activeGame: infiniteCache ? infinity : MsDuration.minutes(3),
  activeGameLoading: infiniteCache ? infinity : MsDuration.seconds(5),
  challenges: infiniteCache ? infinity : MsDuration.seconds(3),
  leagueEntries: infiniteCache ? infinity : MsDuration.minutes(3),
  masteries: infiniteCache ? infinity : MsDuration.minutes(3),
  summoner: infiniteCache ? infinity : MsDuration.minutes(9),
})

const load: IO<Config> = pipe(loadDotEnv, IO.map(parse), IO.chain(IO.fromEither))

const Lens = {
  logLevel: pipe(lens.id<Config>(), lens.prop('logLevel')),
}

export const Config = { load, Lens }
