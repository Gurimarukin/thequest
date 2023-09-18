import { pipe } from 'fp-ts/function'

import type { DayJs } from '../../shared/models/DayJs'
import type { Maybe, NotUsed } from '../../shared/utils/fp'
import { Future } from '../../shared/utils/fp'

import { FpCollection } from '../helpers/FpCollection'
import { PorofessorActiveGameDb } from '../models/activeGame/PorofessorActiveGameDb'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
import type { MongoCollectionGetter } from '../models/mongo/MongoCollection'
import { GameId } from '../models/riot/GameId'
import { DayJsFromDate } from '../utils/ioTsUtils'

type PorofessorActiveGamePersistence = ReturnType<typeof PorofessorActiveGamePersistence>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const PorofessorActiveGamePersistence = (
  Logger: LoggerGetter,
  mongoCollection: MongoCollectionGetter,
) => {
  const logger = Logger('PorofessorActiveGamePersistence')
  const collection = FpCollection(logger)([PorofessorActiveGameDb.codec, 'PorofessorActiveGameDb'])(
    mongoCollection('porofessorActiveGame'),
  )

  const ensureIndexes: Future<NotUsed> = collection.ensureIndexes([
    { key: { gameId: -1 }, unique: true },
  ])

  return {
    ensureIndexes,

    findById: (gameId: GameId): Future<Maybe<PorofessorActiveGameDb>> =>
      collection.findOne({ gameId: GameId.codec.encode(gameId) }),

    upsert: (game: PorofessorActiveGameDb): Future<boolean> =>
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

export { PorofessorActiveGamePersistence }
