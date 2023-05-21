import { pipe } from 'fp-ts/function'

import type { DayJs } from '../../shared/models/DayJs'
import type { Maybe, NotUsed } from '../../shared/utils/fp'
import { Future } from '../../shared/utils/fp'

import { FpCollection } from '../helpers/FpCollection'
import { ActiveGameDb } from '../models/activeGame/ActiveGameDb'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
import type { MongoCollectionGetter } from '../models/mongo/MongoCollection'
import { GameId } from '../models/riot/GameId'
import { SummonerId } from '../models/summoner/SummonerId'
import { DayJsFromDate } from '../utils/ioTsUtils'

type ActiveGamePersistence = ReturnType<typeof ActiveGamePersistence>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const ActiveGamePersistence = (Logger: LoggerGetter, mongoCollection: MongoCollectionGetter) => {
  const logger = Logger('ActiveGamePersistence')
  const collection = FpCollection(logger)([ActiveGameDb.codec, 'ActiveGameDb'])(
    mongoCollection('activeGame'),
  )

  const Key = {
    participantsSummonerId: collection.path('participants', 'summonerId'),
  }

  const ensureIndexes: Future<NotUsed> = collection.ensureIndexes([
    { key: { gameId: -1 }, unique: true },
  ])

  return {
    ensureIndexes,

    findBySummonerId: (summonerId: SummonerId, insertedAfter: DayJs): Future<Maybe<ActiveGameDb>> =>
      collection.findOne({
        [Key.participantsSummonerId]: SummonerId.codec.encode(summonerId),
        insertedAt: { $gte: DayJsFromDate.codec.encode(insertedAfter) },
      }),

    upsert: (game: ActiveGameDb): Future<boolean> =>
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

export { ActiveGamePersistence }