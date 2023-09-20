import { pipe } from 'fp-ts/function'

import type { DayJs } from '../../shared/models/DayJs'
import type { Maybe, NotUsed } from '../../shared/utils/fp'
import { Future } from '../../shared/utils/fp'

import { FpCollection } from '../helpers/FpCollection'
import { PoroActiveGameDb } from '../models/activeGame/PoroActiveGameDb'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
import type { MongoCollectionGetter } from '../models/mongo/MongoCollection'
import { GameId } from '../models/riot/GameId'
import { DayJsFromDate } from '../utils/ioTsUtils'

type PoroActiveGamePersistence = ReturnType<typeof PoroActiveGamePersistence>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const PoroActiveGamePersistence = (
  Logger: LoggerGetter,
  mongoCollection: MongoCollectionGetter,
) => {
  const logger = Logger('PoroActiveGamePersistence')
  const collection = FpCollection(logger)([PoroActiveGameDb.codec, 'PoroActiveGameDb'])(
    mongoCollection('poroActiveGame'),
  )

  const ensureIndexes: Future<NotUsed> = collection.ensureIndexes([
    { key: { gameId: -1 }, unique: true },
  ])

  return {
    ensureIndexes,

    findById: (gameId: GameId): Future<Maybe<PoroActiveGameDb>> =>
      collection.findOne({ gameId: GameId.codec.encode(gameId) }),

    upsert: (game: PoroActiveGameDb): Future<boolean> =>
      pipe(
        collection.updateOne({ gameId: GameId.codec.encode(game.gameId) }, game, {
          upsert: true,
        }),
        Future.map(r => r.modifiedCount + r.upsertedCount <= 1),
      ),

    deleteBeforeDate: (date: DayJs): Future<number> =>
      pipe(
        collection.deleteMany({ insertedAt: { $lt: DayJsFromDate.codec.encode(date) } }),
        Future.map(r => r.deletedCount),
      ),
  }
}

export { PoroActiveGamePersistence }
