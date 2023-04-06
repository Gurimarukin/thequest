import { pipe } from 'fp-ts/function'
import type { AnyBulkWriteOperation } from 'mongodb'

import { ChampionKey } from '../../shared/models/api/ChampionKey'
import type { TObservable } from '../../shared/models/rx/TObservable'
import type { NotUsed } from '../../shared/utils/fp'
import { Future, List, NonEmptyArray } from '../../shared/utils/fp'

import { FpCollection } from '../helpers/FpCollection'
import type { ChampionShardsLevel } from '../models/ChampionShardsLevel'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
import type { MongoCollectionGetter } from '../models/mongo/MongoCollection'
import { SummonerId } from '../models/summoner/SummonerId'
import type { ChampionShardsDbOutput } from '../models/user/ChampionShardsDb'
import { ChampionShardsDb } from '../models/user/ChampionShardsDb'
import { UserId } from '../models/user/UserId'

type ToDeleteAndToUpsert<A> = {
  toDelete: List<A>
  toUpsert: List<A>
}

type ChampionShardPersistence = ReturnType<typeof ChampionShardPersistence>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const ChampionShardPersistence = (Logger: LoggerGetter, mongoCollection: MongoCollectionGetter) => {
  const logger = Logger('ChampionShardPersistence')
  const collection = FpCollection(logger)([ChampionShardsDb.codec, 'ChampionShardsDb'])(
    mongoCollection('championShard'),
  )

  const ensureIndexes: Future<NotUsed> = collection.ensureIndexes([
    { key: { user: -1, summoner: -1, champion: -1 }, unique: true },
  ])

  return {
    ensureIndexes,

    listForSummoner: (user: UserId, summoner: SummonerId): TObservable<ChampionShardsDb> =>
      collection.findAll()({
        user: UserId.codec.encode(user),
        summoner: SummonerId.codec.encode(summoner),
      }),

    bulkDeleteAndUpsert: (
      user: UserId,
      summoner: SummonerId,
      { toDelete, toUpsert }: ToDeleteAndToUpsert<ChampionShardsLevel>,
    ): Future<boolean> => {
      const operations: List<AnyBulkWriteOperation<ChampionShardsDbOutput>> = pipe(
        !List.isNonEmpty(toDelete)
          ? []
          : [
              {
                deleteMany: {
                  filter: {
                    user: UserId.codec.encode(user),
                    summoner: SummonerId.codec.encode(summoner),
                    champion: {
                      $in: pipe(
                        toDelete,
                        NonEmptyArray.map(a => a.championId),
                        NonEmptyArray.codec(ChampionKey.codec).encode,
                      ),
                    },
                  },
                },
              },
            ],
        List.concat(
          pipe(
            toUpsert,
            List.map((c): AnyBulkWriteOperation<ChampionShardsDbOutput> => {
              const {
                user: encodedUser,
                summoner: encodedSummoner,
                champion: encodedChampion,
                ...$set
              } = ChampionShardsDb.codec.encode({
                user,
                summoner,
                champion: c.championId,
                count: c.shardsCount,
                updatedWhenChampionLevel: c.championLevel,
              })
              return {
                updateOne: {
                  filter: {
                    user: encodedUser,
                    summoner: encodedSummoner,
                    champion: encodedChampion,
                  },
                  update: { $set },
                  upsert: true,
                },
              }
            }),
          ),
        ),
      )

      return !List.isNonEmpty(operations)
        ? Future.successful(true)
        : pipe(
            collection.collection.future(c =>
              c.bulkWrite(NonEmptyArray.asMutable(operations), { ordered: false }),
            ),
            Future.map(
              r =>
                r.deletedCount <= toDelete.length &&
                r.modifiedCount + r.upsertedCount <= toUpsert.length,
            ),
          )
    },
  }
}

export { ChampionShardPersistence }
