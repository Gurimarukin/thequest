import { pipe } from 'fp-ts/function'

import type { DayJs } from '../../shared/models/DayJs'
import { Puuid } from '../../shared/models/api/summoner/Puuid'
import type { Maybe, NotUsed } from '../../shared/utils/fp'
import { Future } from '../../shared/utils/fp'

import { FpCollection } from '../helpers/FpCollection'
import { LeagueEntryDb } from '../models/league/LeagueEntryDb'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
import type { MongoCollectionGetter } from '../models/mongo/MongoCollection'
import { DayJsFromDate } from '../utils/ioTsUtils'

type LeagueEntryPersistence = ReturnType<typeof LeagueEntryPersistence>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const LeagueEntryPersistence = (Logger: LoggerGetter, mongoCollection: MongoCollectionGetter) => {
  const logger = Logger('LeagueEntryPersistence')
  const collection = FpCollection(logger)([LeagueEntryDb.codec, 'LeagueEntryDb'])(
    mongoCollection('leagueEntry'),
  )

  const ensureIndexes: Future<NotUsed> = collection.ensureIndexes([
    { key: { puuid: -1 }, unique: true },
  ])

  return {
    ensureIndexes,

    findByPuuid: (puuid: Puuid, insertedAfter: DayJs): Future<Maybe<LeagueEntryDb>> =>
      collection.findOne({
        puuid: Puuid.codec.encode(puuid),
        insertedAt: { $gte: DayJsFromDate.codec.encode(insertedAfter) },
      }),

    upsert: (entries: LeagueEntryDb): Future<boolean> =>
      pipe(
        collection.updateOne({ puuid: Puuid.codec.encode(entries.puuid) }, entries, {
          upsert: true,
        }),
        Future.map(r => r.modifiedCount + r.upsertedCount <= 1),
      ),
  }
}

export { LeagueEntryPersistence }
