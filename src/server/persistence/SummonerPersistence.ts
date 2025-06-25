import { pipe } from 'fp-ts/function'

import type { DayJs } from '../../shared/models/DayJs'
import { Platform } from '../../shared/models/api/Platform'
import { Puuid } from '../../shared/models/api/summoner/Puuid'
import type { Maybe, NotUsed } from '../../shared/utils/fp'
import { Future, List, NonEmptyArray } from '../../shared/utils/fp'

import { FpCollection } from '../helpers/FpCollection'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
import type { MongoCollectionGetter } from '../models/mongo/MongoCollection'
import { SummonerDb, SummonerDbPuuidOnly } from '../models/summoner/SummonerDb'
import { DayJsFromDate } from '../utils/ioTsUtils'

type SummonerPersistence = ReturnType<typeof SummonerPersistence>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const SummonerPersistence = (Logger: LoggerGetter, mongoCollection: MongoCollectionGetter) => {
  const logger = Logger('SummonerPersistence')
  const collection = FpCollection(logger)([SummonerDb.codec, 'SummonerDb'])(
    mongoCollection('summoner'),
  )

  const ensureIndexes: Future<NotUsed> = collection.ensureIndexes([
    { key: { puuid: -1 }, unique: true },
  ])

  return {
    ensureIndexes,

    findByPuuid: (platform: Platform, puuid: Puuid): Future<Maybe<SummonerDb>> =>
      collection.findOne({
        platform: Platform.codec.encode(platform),
        puuid: Puuid.codec.encode(puuid),
      }),

    insert: (summoner: SummonerDb): Future<boolean> =>
      pipe(
        collection.insertOne(summoner),
        Future.map(r => r.acknowledged),
      ),

    update: (summoner: SummonerDb): Future<boolean> => {
      const encoded = SummonerDb.codec.encode(summoner)

      return pipe(
        collection.collection.future(c => c.updateOne({ puuid: encoded.puuid }, { $set: encoded })),
        Future.map(r => r.matchedCount + r.modifiedCount <= 1),
      )
    },

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
