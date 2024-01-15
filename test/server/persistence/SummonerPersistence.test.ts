/* eslint-disable functional/no-expression-statements */
import { pipe } from 'fp-ts/function'

import { DayJs } from '../../../src/shared/models/DayJs'
import { MsDuration } from '../../../src/shared/models/MsDuration'
import type { Platform } from '../../../src/shared/models/api/Platform'
import { Puuid } from '../../../src/shared/models/api/summoner/Puuid'
import { SummonerName } from '../../../src/shared/models/riot/SummonerName'
import { Future, Maybe } from '../../../src/shared/utils/fp'

import { futureRunUnsafe } from '../../../src/client/utils/futureRunUnsafe'

import { Config } from '../../../src/server/config/Config'
import { MongoCollectionGetter } from '../../../src/server/models/mongo/MongoCollection'
import { WithDb } from '../../../src/server/models/mongo/WithDb'
import type { SummonerDb } from '../../../src/server/models/summoner/SummonerDb'
import { SummonerId } from '../../../src/server/models/summoner/SummonerId'
import { SummonerPersistence } from '../../../src/server/persistence/SummonerPersistence'

import { Logger } from '../../Logger'
import { expectT } from '../../expectT'

const dbRetryDelay = MsDuration.seconds(10)

describe('SummonerPersistence', () => {
  const withDb = pipe(
    Config.load,
    Future.fromIOEither,
    Future.chain(config => {
      const logger = Logger('RiotAccountPersistence.test')

      return WithDb.load(config.db, logger, dbRetryDelay)
    }),
    futureRunUnsafe,
  )
  const summonerPersistence = pipe(
    Future.tryCatch(() => withDb),
    Future.map(w => SummonerPersistence(Logger, MongoCollectionGetter.fromWithDb(w))),
  )

  const puuid = Puuid('test-puuid')
  const platform: Platform = 'KR'
  const summonerName = SummonerName('  Hide on bush')

  const faker: SummonerDb = {
    id: SummonerId('test-summonerId'),
    puuid,
    platform,
    name: summonerName,
    profileIconId: 0,
    summonerLevel: 0,
    insertedAt: DayJs.now(),
  }
  const day0 = DayJs.of(0)

  beforeAll(() =>
    pipe(
      summonerPersistence,
      Future.chain(p => p.upsert(faker)),
      futureRunUnsafe,
    ),
  )

  afterAll(() => withDb.then(a => a.client.close()))

  it('should find by exact puuid', () => expectFaker(p => p.findByPuuid(platform, puuid, day0)))

  it('should find by exact name', () =>
    // eslint-disable-next-line deprecation/deprecation
    expectFaker(p => p.findByName(platform, summonerName, day0)))

  it('should find by trimed lower name', () => expectFakerRiotId('hideonbush'))

  it('should find by spaced upper name', () => expectFakerRiotId('H I D E O N B U S H'))

  it('should not ignore accents', () =>
    pipe(
      summonerPersistence,
      // eslint-disable-next-line deprecation/deprecation
      Future.chain(p => p.findByName(platform, SummonerName('  Hide ón bush'), day0)),
      Future.map(actual => {
        expectT(actual).toStrictEqual(Maybe.none)
      }),
      futureRunUnsafe,
    ))

  it('should match platform', () =>
    pipe(
      summonerPersistence,
      // eslint-disable-next-line deprecation/deprecation
      Future.chain(p => p.findByName('EUW', summonerName, day0)),
      Future.map(actual => {
        expectT(actual).toStrictEqual(Maybe.none)
      }),
      futureRunUnsafe,
    ))

  function expectFaker(f: (p: SummonerPersistence) => Future<Maybe<SummonerDb>>): Promise<void> {
    return pipe(
      summonerPersistence,
      Future.flatMap(f),
      Future.map(actual => {
        expectT(actual).toStrictEqual(Maybe.some(faker))
      }),
      futureRunUnsafe,
    )
  }

  function expectFakerRiotId(name: string): Promise<void> {
    // eslint-disable-next-line deprecation/deprecation
    return expectFaker(p => p.findByName(platform, SummonerName(name), day0))
  }
})
