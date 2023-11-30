import { pipe } from 'fp-ts/function'

import type { DayJs } from '../../shared/models/DayJs'
import { Puuid } from '../../shared/models/api/summoner/Puuid'
import { RiotId } from '../../shared/models/riot/RiotId'
import type { Maybe, NotUsed } from '../../shared/utils/fp'
import { Future } from '../../shared/utils/fp'

import { FpCollection, FpCollectionHelpers } from '../helpers/FpCollection'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
import type { MongoCollectionGetter } from '../models/mongo/MongoCollection'
import { RiotAccountDb } from '../models/riot/RiotAccountDb'
import { DayJsFromDate } from '../utils/ioTsUtils'

const { caseInsensitiveCollation } = FpCollectionHelpers

type RiotAccountPersistence = ReturnType<typeof RiotAccountPersistence>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const RiotAccountPersistence = (Logger: LoggerGetter, mongoCollection: MongoCollectionGetter) => {
  const logger = Logger('RiotAccountPersistence')
  const collection = FpCollection(logger)([RiotAccountDb.codec, 'RiotAccountDb'])(
    mongoCollection('riotAccount'),
  )

  const ensureIndexes: Future<NotUsed> = collection.ensureIndexes([
    { key: { puuid: -1 }, unique: true },
    { key: { riotId: -1 }, unique: true, collation: caseInsensitiveCollation },
  ])

  return {
    ensureIndexes,

    findByRiotId: (riotId: RiotId, insertedAfter: DayJs): Future<Maybe<RiotAccountDb>> =>
      collection.findOne(
        {
          riotId: RiotId.fromStringCodec.encode(riotId),
          insertedAt: { $gte: DayJsFromDate.codec.encode(insertedAfter) },
        },
        { collation: caseInsensitiveCollation },
      ),

    findByPuuid: (puuid: Puuid, insertedAfter: DayJs): Future<Maybe<RiotAccountDb>> =>
      collection.findOne({
        puuid: Puuid.codec.encode(puuid),
        insertedAt: { $gte: DayJsFromDate.codec.encode(insertedAfter) },
      }),

    upsert: (account: RiotAccountDb): Future<boolean> =>
      pipe(
        collection.updateOne({ puuid: Puuid.codec.encode(account.puuid) }, account, {
          upsert: true,
          collation: caseInsensitiveCollation,
        }),
        Future.map(r => r.modifiedCount + r.upsertedCount <= 1),
      ),
  }
}

export { RiotAccountPersistence }
