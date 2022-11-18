import { pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'

import type { DayJs } from '../../shared/models/DayJs'
import { Platform } from '../../shared/models/api/Platform'
import type { Maybe, NotUsed } from '../../shared/utils/fp'
import { Future, NonEmptyArray } from '../../shared/utils/fp'

import { FpCollection } from '../helpers/FpCollection'
import { PlatformWithPuuid } from '../models/PlatformWithPuuid'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
import type { MongoCollectionGetter } from '../models/mongo/MongoCollection'
import { Puuid } from '../models/riot/Puuid'
import { SummonerDb } from '../models/summoner/SummonerDb'
import { DayJsFromDate } from '../utils/ioTsUtils'

type SummonerPersistence = ReturnType<typeof SummonerPersistence>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const SummonerPersistence = (Logger: LoggerGetter, mongoCollection: MongoCollectionGetter) => {
  const logger = Logger('SummonerPersistence')
  const collection = FpCollection(logger)([SummonerDb.codec, 'Summoner'])(
    mongoCollection('summoner'),
  )

  const ensureIndexes: Future<NotUsed> = collection.ensureIndexes([
    { key: { platform: -1, puuid: -1 }, unique: true },
    { key: { platform: -1, name: -1 }, unique: true, collation: { locale: 'en', strength: 2 } }, // case insensitive
  ])

  return {
    ensureIndexes,

    findByName: (
      platform: Platform,
      name: string,
      insertedAfter: DayJs,
    ): Future<Maybe<SummonerDb>> =>
      collection.findOne({
        platform: Platform.codec.encode(platform),
        name: RegExp(`^${C.string.encode(name)}$`, 'i'),
        insertedAt: { $gte: DayJsFromDate.codec.encode(insertedAfter) },
      }),

    findByPuiid: (
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
        collection.updateOne({}, summoner, { upsert: true }),
        Future.map(r => r.modifiedCount + r.upsertedCount <= 1),
      ),

    deleteSummoners: (searches: NonEmptyArray<PlatformWithPuuid>): Future<number> =>
      pipe(
        collection.deleteMany({
          $or: pipe(
            searches,
            NonEmptyArray.map(PlatformWithPuuid.codec.encode),
            NonEmptyArray.asMutable,
          ),
        }),
        Future.map(r => r.deletedCount),
      ),
  }
}

export { SummonerPersistence }
