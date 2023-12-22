/* eslint-disable functional/no-expression-statements */
import { fail } from 'assert'
import { pipe } from 'fp-ts/function'
import * as D from 'io-ts/Decoder'

import { DayJs } from '../../../src/shared/models/DayJs'
import { Puuid } from '../../../src/shared/models/api/summoner/Puuid'
import { GameName } from '../../../src/shared/models/riot/GameName'
import { RiotId } from '../../../src/shared/models/riot/RiotId'
import { TagLine } from '../../../src/shared/models/riot/TagLine'
import { Either, Future, Maybe } from '../../../src/shared/utils/fp'

import { futureRunUnsafe } from '../../../src/client/utils/futureRunUnsafe'

import { Config } from '../../../src/server/config/Config'
import { MongoCollectionGetter } from '../../../src/server/models/mongo/MongoCollection'
import { WithDb } from '../../../src/server/models/mongo/WithDb'
import type { RiotAccountDb } from '../../../src/server/models/riot/RiotAccountDb'
import { RiotAccountPersistence } from '../../../src/server/persistence/RiotAccountPersistence'

import { Logger } from '../../Logger'
import { expectT } from '../../expectT'

describe('RiotAccountPersistence', () => {
  const withDb = pipe(
    Config.load,
    Future.fromIOEither,
    Future.chain(config => WithDb.load(config.db)),
    futureRunUnsafe,
  )
  const riotAccountPersistence = pipe(
    Future.tryCatch(() => withDb),
    Future.map(w => RiotAccountPersistence(Logger, MongoCollectionGetter.fromWithDb(w))),
  )

  const puuid = Puuid('test-puuid')
  const gameName = GameName('  Hide on bush')
  const tagLine = TagLine(' Kr K')
  const riotId = RiotId(gameName, tagLine)

  const faker: RiotAccountDb = {
    puuid,
    riotId,
    insertedAt: DayJs.now(),
  }
  const day0 = DayJs.of(0)

  beforeAll(() =>
    pipe(
      riotAccountPersistence,
      Future.chain(p => p.upsert(faker)),
      futureRunUnsafe,
    ),
  )

  afterAll(() => withDb.then(a => a.client.close()))

  it('should find by exact puuid', () => expectFaker(p => p.findByPuuid(puuid, day0)))

  it('should find by exact riotId', () => expectFaker(p => p.findByRiotId(riotId, day0)))

  it('should find by trimed lower gameName', () => expectFakerRiotId(`hideonbush#${tagLine}`))

  it('should find by trimed lower tagLine', () => expectFakerRiotId(`${gameName}#krk`))

  it('should find by trimed upper riotId', () => expectFakerRiotId('HIDEONBUSH#KRK'))

  it('should not ignore accents', () =>
    pipe(
      riotAccountPersistence,
      Future.chain(p => p.findByRiotId(RiotId(GameName('  Hide ón bush'), tagLine), day0)),
      Future.map(actual => {
        expectT(actual).toStrictEqual(Maybe.none)
      }),
      futureRunUnsafe,
    ))

  function expectFaker(
    f: (p: RiotAccountPersistence) => Future<Maybe<RiotAccountDb>>,
  ): Promise<void> {
    return pipe(
      riotAccountPersistence,
      Future.chain(f),
      Future.map(actual => {
        expectT(actual).toStrictEqual(Maybe.some(faker))
      }),
      futureRunUnsafe,
    )
  }

  function expectFakerRiotId(rawiotId: string): Promise<void> {
    const myRiotId = RiotId.fromStringDecoder.decode(rawiotId)

    if (!Either.isRight(myRiotId)) {
      fail(`myRiotId should be right\n${D.draw(myRiotId.left)}`)
    }

    return expectFaker(p => p.findByRiotId(myRiotId.right, day0))
  }
})
