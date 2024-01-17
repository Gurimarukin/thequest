import { pipe } from 'fp-ts/function'

import type { DayJs } from '../../shared/models/DayJs'
import { Platform } from '../../shared/models/api/Platform'
import { Puuid } from '../../shared/models/api/summoner/Puuid'
import { SummonerName } from '../../shared/models/riot/SummonerName'
import type { Maybe, NotUsed } from '../../shared/utils/fp'
import { Future, List, NonEmptyArray } from '../../shared/utils/fp'

import { FpCollection, FpCollectionHelpers } from '../helpers/FpCollection'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
import type { MongoCollectionGetter } from '../models/mongo/MongoCollection'
import { SummonerDb, SummonerDbPuuidOnly } from '../models/summoner/SummonerDb'
import { SummonerId } from '../models/summoner/SummonerId'
import { DayJsFromDate } from '../utils/ioTsUtils'

const { caseInsensitiveCollation } = FpCollectionHelpers

type SummonerPersistence = ReturnType<typeof SummonerPersistence>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const SummonerPersistence = (Logger: LoggerGetter, mongoCollection: MongoCollectionGetter) => {
  const logger = Logger('SummonerPersistence')
  const collection = FpCollection(logger)([SummonerDb.codec, 'SummonerDb'])(
    mongoCollection('summoner'),
  )

  const ensureIndexes: Future<NotUsed> = collection.ensureIndexes([
    { key: { id: -1 }, unique: true },
    { key: { puuid: -1 }, unique: true },
    { key: { platform: -1, name: -1 }, unique: true, collation: caseInsensitiveCollation },
  ])

  return {
    ensureIndexes,

    findById: (
      platform: Platform,
      id: SummonerId,
      insertedAfter: DayJs,
    ): Future<Maybe<SummonerDb>> =>
      collection.findOne({
        platform: Platform.codec.encode(platform),
        id: SummonerId.codec.encode(id),
        insertedAt: { $gte: DayJsFromDate.codec.encode(insertedAfter) },
      }),

    /** @deprecated SummonerName will be removed */
    // eslint-disable-next-line deprecation/deprecation
    findByName: (
      platform: Platform,
      name: SummonerName,
      insertedAfter: DayJs,
    ): Future<Maybe<SummonerDb>> =>
      collection.findOne(
        {
          platform: Platform.codec.encode(platform),
          name: SummonerName.codec.encode(name),
          insertedAt: { $gte: DayJsFromDate.codec.encode(insertedAfter) },
        },
        { collation: caseInsensitiveCollation },
      ),

    findByPuuid: (
      platform: Platform,
      puuid: Puuid,
      insertedAfter: DayJs,
    ): Future<Maybe<SummonerDb>> =>
      collection.findOne({
        platform: Platform.codec.encode(platform),
        puuid: Puuid.codec.encode(puuid),
        insertedAt: { $gte: DayJsFromDate.codec.encode(insertedAfter) },
      }),

    upsert: (summoner: SummonerDb): Future<boolean> =>
      pipe(
        collection.updateOne({ id: SummonerId.codec.encode(summoner.id) }, summoner, {
          upsert: true,
          collation: caseInsensitiveCollation,
        }),
        Future.map(r => r.modifiedCount + r.upsertedCount <= 1),
      ),

    deleteByPuuid: (searches: List<SummonerDbPuuidOnly>): Future<number> =>
      !List.isNonEmpty(searches)
        ? Future.successful(0)
        : pipe(
            collection.deleteMany({
              $or: NonEmptyArray.asMutable(
                NonEmptyArray.encoder(SummonerDbPuuidOnly.encoder).encode(searches),
              ),
            }),
            Future.map(r => r.deletedCount),
          ),

    deleteBeforeDate: (date: DayJs): Future<number> =>
      pipe(
        collection.deleteMany({ insertedAt: { $lt: DayJsFromDate.codec.encode(date) } }),
        Future.map(r => r.deletedCount),
      ),
  }
}

export { SummonerPersistence }
