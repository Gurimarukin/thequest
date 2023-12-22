import { pipe } from 'fp-ts/function'

import { GameId } from '../../shared/models/api/GameId'
import type { NotUsed } from '../../shared/utils/fp'
import { Either, Future, Maybe } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'
import { decodeError } from '../../shared/utils/ioTsUtils'

import { FpCollection } from '../helpers/FpCollection'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
import type { MatchDbOutput } from '../models/match/MatchDb'
import { MatchDb } from '../models/match/MatchDb'
import type { MongoCollectionGetter } from '../models/mongo/MongoCollection'

type MatchPersistence = ReturnType<typeof MatchPersistence>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const MatchPersistence = (Logger: LoggerGetter, mongoCollection: MongoCollectionGetter) => {
  const logger = Logger('MatchPersistence')
  const collection = FpCollection(logger)([MatchDb.codec, 'MatchDb'])(mongoCollection('match'))

  const ensureIndexes: Future<NotUsed> = collection.ensureIndexes([
    { key: { id: -1 }, unique: true },
  ])

  return {
    ensureIndexes,

    findById: (id: GameId): Future<Maybe<MatchDb>> =>
      pipe(
        collection.collection.future(c => c.findOne({ id: GameId.codec.encode(id) })),
        Future.chainFirstIOEitherK(res => logger.trace('Found one', jsonStringifyShort(res))),
        Future.map(Maybe.fromNullable),
        futureMaybe.chainEitherK(u =>
          pipe(MatchDb.codec.decode(u), Either.mapLeft(decodeError('MatchDb')(u))),
        ),
      ),

    insert: (match: MatchDb): Future<boolean> => {
      const encoded = MatchDb.codec.encode(match)
      return pipe(
        collection.collection.future(c => c.insertOne(encoded)),
        Future.chainFirstIOEitherK(() => logger.trace('Inserted', jsonStringifyShort(encoded))),
        Future.map(r => r.acknowledged),
      )
    },
  }
}

export { MatchPersistence }

const jsonStringifyShort = (match: MatchDb | MatchDbOutput | null): string => {
  if (match === null) return 'null'
  const {
    teams: {},
    ...short
  } = match
  return `${JSON.stringify(short).slice(0, -1)}...}`
}
