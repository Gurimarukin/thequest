import { pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'
import type { CollationOptions } from 'mongodb'

import type { DayJs } from '../../shared/models/DayJs'
import { Platform } from '../../shared/models/api/Platform'
import type { Maybe, NotUsed } from '../../shared/utils/fp'
import { Future, List, NonEmptyArray } from '../../shared/utils/fp'

import { FpCollection } from '../helpers/FpCollection'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
import type { MongoCollectionGetter } from '../models/mongo/MongoCollection'
import { Puuid } from '../models/riot/Puuid'
import { SummonerDb, SummonerDbPuuidOnly } from '../models/summoner/SummonerDb'
import { SummonerId } from '../models/summoner/SummonerId'
import { DayJsFromDate } from '../utils/ioTsUtils'

// https://www.mongodb.com/docs/manual/reference/collation
const platformAndNameIndexCollation: CollationOptions = {
  locale: 'en',

  // level 1: compare base characters only, ignoring other differences such as diacritics and case
  // level 2: also compare diacritics (but not case)
  strength: 2,

  // whitespace and punctuation are not considered as base characters
  alternate: 'shifted',
}

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
    { key: { platform: -1, name: -1 }, unique: true, collation: platformAndNameIndexCollation },
  ])

  return {
    ensureIndexes,

    findByName: (
      platform: Platform,
      name: string,
      insertedAfter: DayJs,
    ): Future<Maybe<SummonerDb>> =>
      collection.findOne(
        {
          platform: Platform.codec.encode(platform),
          name: C.string.encode(name),
          insertedAt: { $gte: DayJsFromDate.codec.encode(insertedAfter) },
        },
        { collation: platformAndNameIndexCollation },
      ),

    findByPuuid: (puuid: Puuid, insertedAfter: DayJs): Future<Maybe<SummonerDb>> =>
      collection.findOne({
        puuid: Puuid.codec.encode(puuid),
        insertedAt: { $gte: DayJsFromDate.codec.encode(insertedAfter) },
      }),

    upsert: (summoner: SummonerDb): Future<boolean> =>
      pipe(
        collection.updateOne({ id: SummonerId.codec.encode(summoner.id) }, summoner, {
          upsert: true,
          collation: platformAndNameIndexCollation,
        }),
        Future.map(r => r.modifiedCount + r.upsertedCount <= 1),
      ),

    deleteByPuuid: (searches: List<SummonerDbPuuidOnly>): Future<number> =>
      !List.isNonEmpty(searches)
        ? Future.right(0)
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
