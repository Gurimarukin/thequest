import { pipe } from 'fp-ts/function'

import { DiscordUserId } from '../../shared/models/discord/DiscordUserId'
import type { List, NotUsed } from '../../shared/utils/fp'
import { Future, NonEmptyArray } from '../../shared/utils/fp'

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

  const listAll: Future<List<HallOfFameMember>> = collection.findAllArr()({})

  const deleteAll: Future<boolean> = pipe(
    collection.deleteMany({}),
    Future.map(res => res.acknowledged),
  )

  return {
    ensureIndexes,

    listAll,

    listForUsers: (ids: NonEmptyArray<DiscordUserId>): Future<List<HallOfFameMember>> =>
      collection.findAllArr()({
        userId: { $in: NonEmptyArray.encoder(DiscordUserId.codec).encode(ids) },
      }),

    deleteAll,

    insertMany: (members: NonEmptyArray<HallOfFameMember>): Future<boolean> =>
      pipe(
        collection.insertMany(members),
        Future.map(res => res.insertedCount === members.length),
      ),
  }
}

export { HallOfFameMemberPersistence }
