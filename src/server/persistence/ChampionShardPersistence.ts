import { pipe } from 'fp-ts/function'
import type { AnyBulkWriteOperation } from 'mongodb'

import { ChampionKey } from '../../shared/models/api/ChampionKey'
import { Sink } from '../../shared/models/rx/Sink'
import type { NotUsed } from '../../shared/utils/fp'
import { Future, List } from '../../shared/utils/fp'

import { FpCollection } from '../helpers/FpCollection'
import type { ChampionShardsLevel } from '../models/ChampionShardsLevel'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
import type { MongoCollectionGetter } from '../models/mongo/MongoCollection'
import { SummonerId } from '../models/summoner/SummonerId'
import type { ChampionShardsDbOutput } from '../models/user/ChampionShardsDb'
import { ChampionShardsDb } from '../models/user/ChampionShardsDb'
import { UserId } from '../models/user/UserId'

type ToDeleteAndToUpsert<A> = {
  readonly toDelete: List<A>
  readonly toUpsert: List<A>
}

type ChampionShardPersistence = Readonly<ReturnType<typeof ChampionShardPersistence>>

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

    listForSummoner: (user: UserId, summoner: SummonerId): Future<List<ChampionShardsDb>> =>
      pipe(
        collection.findAll()({
          user: UserId.codec.encode(user),
          summoner: SummonerId.codec.encode(summoner),
        }),
        Sink.readonlyArray,
      ),

    bulkDeleteAndUpsert: (
      user: UserId,
      summoner: SummonerId,
      { toDelete, toUpsert }: ToDeleteAndToUpsert<ChampionShardsLevel>,
    ): Future<boolean> =>
      pipe(
        collection.collection.future(c =>
          c.bulkWrite(
            [
              {
                deleteMany: {
                  filter: {
                    user: UserId.codec.encode(user),
                    summoner: SummonerId.codec.encode(summoner),
                    champion: {
                      $in: pipe(
                        toDelete,
                        List.map(a => a.championId),
                        List.codec(ChampionKey.codec).encode,
                      ),
                    },
                  },
                },
              },
              ...pipe(
                toUpsert,
                List.map(
                  ({
                    championId,
                    shardsCount,
                    championLevel,
                  }): Readonly<AnyBulkWriteOperation<ChampionShardsDbOutput>> => ({
                    updateOne: {
                      filter: {
                        user: UserId.codec.encode(user),
                        summoner: SummonerId.codec.encode(summoner),
                        champion: ChampionKey.codec.encode(championId),
                      },
                      update: {
                        $set: ((): Readonly<
                          Omit<ChampionShardsDbOutput, 'user' | 'summoner' | 'champion'>
                        > => ({
                          count: shardsCount,
                          updatedWhenChampionLevel: championLevel,
                        }))(),
                      },
                      upsert: true,
                    },
                  }),
                ),
              ),
            ],
            { ordered: false },
          ),
        ),
        Future.map(
          r =>
            r.deletedCount <= toDelete.length &&
            r.modifiedCount + r.upsertedCount <= toUpsert.length,
        ),
      ),
  }
}

export { ChampionShardPersistence }
