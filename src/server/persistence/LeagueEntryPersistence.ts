import { pipe } from 'fp-ts/function'

import type { DayJs } from '../../shared/models/DayJs'
import type { Maybe, NotUsed } from '../../shared/utils/fp'
import { Future } from '../../shared/utils/fp'

import { FpCollection } from '../helpers/FpCollection'
import { LeagueEntryDb } from '../models/league/LeagueEntryDb'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
import type { MongoCollectionGetter } from '../models/mongo/MongoCollection'
import { SummonerId } from '../models/summoner/SummonerId'
import { DayJsFromDate } from '../utils/ioTsUtils'

type LeagueEntryPersistence = ReturnType<typeof LeagueEntryPersistence>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const LeagueEntryPersistence = (Logger: LoggerGetter, mongoCollection: MongoCollectionGetter) => {
  const logger = Logger('LeagueEntryPersistence')
  const collection = FpCollection(logger)([LeagueEntryDb.codec, 'LeagueEntryDb'])(
    mongoCollection('leagueEntry'),
  )

  const ensureIndexes: Future<NotUsed> = collection.ensureIndexes([
    { key: { summonerId: -1 }, unique: true },
  ])

  return {
    ensureIndexes,

    findBySummonerId: (
      summonerId: SummonerId,
      insertedAfter: DayJs,
    ): Future<Maybe<LeagueEntryDb>> =>
      collection.findOne({
        summonerId: SummonerId.codec.encode(summonerId),
        insertedAt: { $gte: DayJsFromDate.codec.encode(insertedAfter) },
      }),

    upsert: (entries: LeagueEntryDb): Future<boolean> =>
      pipe(
        collection.updateOne({ summonerId: SummonerId.codec.encode(entries.summonerId) }, entries, {
          upsert: true,
        }),
        Future.map(r => r.modifiedCount + r.upsertedCount <= 1),
      ),
  }
}

export { LeagueEntryPersistence }
