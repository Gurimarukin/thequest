import { pipe } from 'fp-ts/function'

import { Sink } from '../../shared/models/rx/Sink'
import type { Future, List, NotUsed } from '../../shared/utils/fp'

import { FpCollection } from '../helpers/FpCollection'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
import type { MongoCollectionGetter } from '../models/mongo/MongoCollection'
import { SummonerId } from '../models/riot/SummonerId'
import { ChampionShardsDb } from '../models/user/ChampionShardsDb'
import { UserId } from '../models/user/UserId'

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
  }
}

export { ChampionShardPersistence }
