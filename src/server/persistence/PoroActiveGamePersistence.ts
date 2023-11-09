import { pipe } from 'fp-ts/function'

import type { DayJs } from '../../shared/models/DayJs'
import { Lang } from '../../shared/models/api/Lang'
import { StringUtils } from '../../shared/utils/StringUtils'
import type { NotUsed } from '../../shared/utils/fp'
import { Either, Future, Maybe, Tuple } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'
import { decodeError } from '../../shared/utils/ioTsUtils'

import { FpCollection } from '../helpers/FpCollection'
import { PoroActiveGameDb } from '../models/activeGame/PoroActiveGameDb'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
import type { MongoCollectionGetter } from '../models/mongo/MongoCollection'
import { GameId } from '../models/riot/GameId'
import { DayJsFromDate } from '../utils/ioTsUtils'

const ellipse = StringUtils.ellipse(3300)

type PoroActiveGamePersistence = ReturnType<typeof PoroActiveGamePersistence>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const PoroActiveGamePersistence = (
  Logger: LoggerGetter,
  mongoCollection: MongoCollectionGetter,
) => {
  const codecWithName = Tuple.of(PoroActiveGameDb.codec, 'PoroActiveGameDb')
  const [codec, codecName] = codecWithName

  const logger = Logger('PoroActiveGamePersistence')
  const collection = FpCollection(logger)(codecWithName)(mongoCollection('poroActiveGame'))

  const ensureIndexes: Future<NotUsed> = collection.ensureIndexes([
    { key: { lang: -1, gameId: -1 }, unique: true },
  ])

  return {
    ensureIndexes,

    find: (lang: Lang, gameId: GameId): Future<Maybe<PoroActiveGameDb>> =>
      pipe(
        collection.collection.future(c =>
          c.findOne({ lang: Lang.encoder.encode(lang), gameId: GameId.codec.encode(gameId) }),
        ),
        Future.chainFirstIOEitherK(res => logger.trace('Found one', ellipse(JSON.stringify(res)))),
        Future.map(Maybe.fromNullable),
        futureMaybe.chainEitherK(u =>
          pipe(codec.decode(u), Either.mapLeft(decodeError(codecName)(u))),
        ),
      ),

    upsert: (game: PoroActiveGameDb): Future<boolean> => {
      const encoded = codec.encode(game)
      return pipe(
        collection.collection.future(c =>
          c.updateOne(
            { gameId: GameId.codec.encode(game.gameId) },
            { $set: encoded },
            { upsert: true },
          ),
        ),
        Future.chainFirstIOEitherK(() => logger.trace('Updated', ellipse(JSON.stringify(encoded)))),
        Future.map(r => r.modifiedCount + r.upsertedCount <= 1),
      )
    },

    deleteBeforeDate: (date: DayJs): Future<number> =>
      pipe(
        collection.deleteMany({ insertedAt: { $lt: DayJsFromDate.codec.encode(date) } }),
        Future.map(r => r.deletedCount),
      ),
  }
}

export { PoroActiveGamePersistence }
