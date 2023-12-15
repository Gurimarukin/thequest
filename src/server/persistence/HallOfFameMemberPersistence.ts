import { pipe } from 'fp-ts/function'

import type { NonEmptyArray, NotUsed } from '../../shared/utils/fp'
import { Either, Future, List } from '../../shared/utils/fp'
import { decodeError } from '../../shared/utils/ioTsUtils'

import { FpCollection } from '../helpers/FpCollection'
import { HallOfFameMember } from '../models/HallOfFameMember'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
import type { MongoCollectionGetter } from '../models/mongo/MongoCollection'

type HallOfFameMemberPersistence = ReturnType<typeof HallOfFameMemberPersistence>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function HallOfFameMemberPersistence(Logger: LoggerGetter, mongoCollection: MongoCollectionGetter) {
  const logger = Logger('HallOfFameMemberPersistence')
  const collection = FpCollection(logger)([HallOfFameMember.codec, 'HallOfFameMember'])(
    mongoCollection('hallOfFameMember'),
  )

  const ensureIndexes: Future<NotUsed> = collection.ensureIndexes([
    { key: { userId: -1, puuid: -1 }, unique: true },
  ])

  const listAll: Future<List<HallOfFameMember>> = pipe(
    collection.collection.future(c => c.find({}).toArray()),
    Future.chainEitherK(as =>
      pipe(
        List.decoder(HallOfFameMember.codec).decode(as),
        Either.mapLeft(decodeError('List<HallOfFameMember>')(as)),
      ),
    ),
    Future.chainFirstIOEitherK(as => logger.trace(`Found all ${as.length} documents`)),
  )

  const deleteAll: Future<boolean> = pipe(
    collection.deleteMany({}),
    Future.map(res => res.acknowledged),
  )

  return {
    ensureIndexes,

    listAll,

    deleteAll,

    insertMany: (members: NonEmptyArray<HallOfFameMember>): Future<boolean> =>
      pipe(
        collection.insertMany(members),
        Future.map(res => res.insertedCount === members.length),
      ),
  }
}

export { HallOfFameMemberPersistence }
