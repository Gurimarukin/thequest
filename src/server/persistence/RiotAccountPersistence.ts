import { pipe } from 'fp-ts/function'
import * as E from 'io-ts/Encoder'

import type { DayJs } from '../../shared/models/DayJs'
import type { Maybe, NotUsed } from '../../shared/utils/fp'
import { Future } from '../../shared/utils/fp'

import { FpCollection } from '../helpers/FpCollection'
import { RiotAccountDb } from '../models/RiotAccountDb'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
import type { MongoCollectionGetter } from '../models/mongo/MongoCollection'
import { Puuid } from '../models/riot/Puuid'
import { TagLine } from '../models/riot/TagLine'
import { DayJsFromDate } from '../utils/ioTsUtils'

type RiotAccountPersistence = ReturnType<typeof RiotAccountPersistence>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const RiotAccountPersistence = (Logger: LoggerGetter, mongoCollection: MongoCollectionGetter) => {
  const logger = Logger('RiotAccountPersistence')
  const collection = FpCollection(logger)([RiotAccountDb.codec, 'RiotAccountDb'])(
    mongoCollection('riotAccount'),
  )

  const ensureIndexes: Future<NotUsed> = collection.ensureIndexes([
    { key: { gameName: -1, tagLine: -1 }, unique: true },
    { key: { puuid: -1 }, unique: true },
  ])

  return {
    ensureIndexes,

    findByGameNameAndTagLine: (
      gameName: string,
      tagLine: TagLine,
      insertedAfter: DayJs,
    ): Future<Maybe<RiotAccountDb>> =>
      collection.findOne({
        gameName: E.id<string>().encode(gameName),
        tagLine: TagLine.codec.encode(tagLine),
        insertedAt: { $gte: DayJsFromDate.codec.encode(insertedAfter) },
      }),

    upsert: (account: RiotAccountDb): Future<boolean> =>
      pipe(
        collection.updateOne({ puuid: Puuid.codec.encode(account.puuid) }, account, {
          upsert: true,
        }),
        Future.map(r => r.modifiedCount + r.upsertedCount <= 1),
      ),
  }
}

export { RiotAccountPersistence }
