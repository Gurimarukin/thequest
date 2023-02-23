import { ord } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'
import type { CollationOptions } from 'mongodb'

import { DayJs } from '../../shared/models/DayJs'
import { Platform } from '../../shared/models/api/Platform'
import type { Maybe, NotUsed } from '../../shared/utils/fp'
import { Future, NonEmptyArray } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'

import { FpCollection } from '../helpers/FpCollection'
import { PlatformWithPuuid } from '../models/PlatformWithPuuid'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
import type { MongoCollectionGetter } from '../models/mongo/MongoCollection'
import { Puuid } from '../models/riot/Puuid'
import { SummonerDb } from '../models/summoner/SummonerDb'
import { DayJsFromDate } from '../utils/ioTsUtils'

// https://www.mongodb.com/docs/manual/reference/collation
const platformAndNameIndexCollation: Readonly<CollationOptions> = {
  locale: 'en',

  // level 1: compare base characters only, ignoring other differences such as diacritics and case
  // level 2: also compare diacritics (but not case)
  strength: 2,

  // whitespace and punctuation are not considered as base characters
  alternate: 'shifted',
}

type SummonerPersistence = Readonly<ReturnType<typeof SummonerPersistence>>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const SummonerPersistence = (Logger: LoggerGetter, mongoCollection: MongoCollectionGetter) => {
  const logger = Logger('SummonerPersistence')
  const collection = FpCollection(logger)([SummonerDb.codec, 'Summoner'])(
    mongoCollection('summoner'),
  )

  const ensureIndexes: Future<NotUsed> = collection.ensureIndexes([
    { key: { platform: -1, puuid: -1 }, unique: true },
    { key: { platform: -1, name: -1 }, unique: true, collation: platformAndNameIndexCollation },
  ])

  return {
    ensureIndexes,

    findByName: (
      platform: Platform,
      name: string,
      insertedAfter: DayJs,
    ): Future<Maybe<SummonerDb>> =>
      pipe(
        collection.findOne(
          {
            platform: Platform.codec.encode(platform),
            name: C.string.encode(name),
          },
          { collation: platformAndNameIndexCollation },
        ),
        futureMaybe.filter(s => ord.leq(DayJs.Ord)(insertedAfter, s.insertedAt)),
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
        collection.updateOne(
          {
            platform: Platform.codec.encode(summoner.platform),
            puuid: Puuid.codec.encode(summoner.puuid),
          },
          summoner,
          { upsert: true },
        ),
        Future.map(r => r.modifiedCount + r.upsertedCount <= 1),
      ),

    deleteByPlatformAndPuuid: (searches: NonEmptyArray<PlatformWithPuuid>): Future<number> =>
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

    deleteBeforeDate: (date: DayJs): Future<number> =>
      pipe(
        collection.deleteMany({ insertedAt: { $lt: DayJsFromDate.codec.encode(date) } }),
        Future.map(r => r.deletedCount),
      ),
  }
}

export { SummonerPersistence }
