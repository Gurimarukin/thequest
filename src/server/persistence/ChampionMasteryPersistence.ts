import { pipe } from 'fp-ts/function'

import type { DayJs } from '../../shared/models/DayJs'
import type { NotUsed } from '../../shared/utils/fp'
import { Either, Future, Maybe } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'
import { decodeError } from '../../shared/utils/ioTsUtils'

import { FpCollection } from '../helpers/FpCollection'
import type { ChampionMasteryDbOutput } from '../models/championMastery/ChampionMasteryDb'
import { ChampionMasteryDb } from '../models/championMastery/ChampionMasteryDb'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
import type { MongoCollectionGetter } from '../models/mongo/MongoCollection'
import { SummonerId } from '../models/summoner/SummonerId'
import { DayJsFromDate } from '../utils/ioTsUtils'

type ChampionMasteryPersistence = Readonly<ReturnType<typeof ChampionMasteryPersistence>>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const ChampionMasteryPersistence = (
  Logger: LoggerGetter,
  mongoCollection: MongoCollectionGetter,
) => {
  const logger = Logger('ChampionMasteryPersistence')
  const collection = FpCollection(logger)([ChampionMasteryDb.codec, 'ChampionMasteryDb'])(
    mongoCollection('championMastery'),
  )

  const ensureIndexes: Future<NotUsed> = collection.ensureIndexes([
    { key: { summonerId: -1 }, unique: true },
  ])

  return {
    ensureIndexes,

    findBySummoner: (
      summonerId: SummonerId,
      insertedAfter: DayJs,
    ): Future<Maybe<ChampionMasteryDb>> =>
      pipe(
        collection.collection.future(c =>
          c.findOne({
            summonerId: SummonerId.codec.encode(summonerId),
            insertedAt: { $gte: DayJsFromDate.codec.encode(insertedAfter) },
          }),
        ),
        Future.chainFirstIOEitherK(res => logger.trace('Found one', jsonStringifyShort(res))),
        Future.map(Maybe.fromNullable),
        futureMaybe.chainEitherK(u =>
          pipe(
            ChampionMasteryDb.codec.decode(u),
            Either.mapLeft(decodeError('ChampionMasteryDb')(u)),
          ),
        ),
      ),

    upsert: (mastery: ChampionMasteryDb): Future<boolean> => {
      const encoded = ChampionMasteryDb.codec.encode(mastery)
      return pipe(
        collection.collection.future(c =>
          c.updateOne(
            { summonerId: SummonerId.codec.encode(mastery.summonerId) },
            { $set: encoded },
            { upsert: true },
          ),
        ),
        Future.chainFirstIOEitherK(() => logger.trace('Updated', jsonStringifyShort(encoded))),
        Future.map(r => r.modifiedCount + r.upsertedCount <= 1),
      )
    },

    // deleteByPlatformAndPuuid: (searches: NonEmptyArray<PlatformWithPuuid>): Future<number> =>
    //   pipe(
    //     collection.deleteMany({
    //       $or: pipe(
    //         searches,
    //         NonEmptyArray.map(PlatformWithPuuid.codec.encode),
    //         NonEmptyArray.asMutable,
    //       ),
    //     }),
    //     Future.map(r => r.deletedCount),
    //   ),

    // deleteBeforeDate: (date: DayJs): Future<number> =>
    //   pipe(
    //     collection.deleteMany({ insertedAt: { $lt: DayJsFromDate.codec.encode(date) } }),
    //     Future.map(r => r.deletedCount),
    //   ),
  }
}

export { ChampionMasteryPersistence }

const jsonStringifyShort = (
  mastery: ChampionMasteryDb | ChampionMasteryDbOutput | null,
): string => {
  if (mastery === null) return 'null'
  const {
    champions: {},
    ...short
  } = mastery
  return `${JSON.stringify(short).slice(0, -1)}...}`
}
