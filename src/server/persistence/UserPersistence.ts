import { pipe } from 'fp-ts/function'
import type { PullOperator } from 'mongodb'

import { UserName } from '../../shared/models/api/user/UserName'
import type { NotUsed } from '../../shared/utils/fp'
import { Future, Maybe, NonEmptyArray, toNotUsed } from '../../shared/utils/fp'

import { FpCollection } from '../helpers/FpCollection'
import { PlatformWithPuuid } from '../models/PlatformWithPuuid'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
import type { MongoCollectionGetter } from '../models/mongo/MongoCollection'
import type { UserOutput } from '../models/user/User'
import { User } from '../models/user/User'
import { UserId } from '../models/user/UserId'

type UserPersistence = ReturnType<typeof UserPersistence>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function UserPersistence(Logger: LoggerGetter, mongoCollection: MongoCollectionGetter) {
  const logger = Logger('UserPersistence')
  const collection = FpCollection(logger)([User.codec, 'User'])(mongoCollection('user'))

  const ensureIndexes: Future<NotUsed> = collection.ensureIndexes([
    { key: { id: -1 }, unique: true },
    { key: { userName: -1 }, unique: true },
  ])

  return {
    ensureIndexes,

    findByUserName: (userName: UserName): Future<Maybe<User>> =>
      collection.findOne({ userName: UserName.codec.encode(userName) }),

    findById: (id: UserId): Future<Maybe<User>> =>
      collection.findOne({ id: UserId.codec.encode(id) }),

    create: (user: User): Future<boolean> =>
      pipe(
        collection.insertOne(user),
        Future.map(r => r.acknowledged),
      ),

    /**
     * @returns `none` if `id` doesn't exist, `some(false)` if `search` is already in favorites
     */
    addFavoriteSearch: (id: UserId, search: PlatformWithPuuid): Future<Maybe<boolean>> =>
      pipe(
        collection.collection.future(c =>
          c.updateOne(
            { id: UserId.codec.encode(id) },
            { $addToSet: { favoriteSearches: PlatformWithPuuid.codec.encode(search) } },
          ),
        ),
        // TODO: logger.trace
        Future.map(res =>
          res.matchedCount === 1 ? Maybe.some(res.modifiedCount === 1) : Maybe.none,
        ),
      ),

    /**
     * @returns `none` if `id` doesn't exist, `some(false)` if `search` was already not in favorites
     */
    removeFavoriteSearch: (id: UserId, search: PlatformWithPuuid): Future<Maybe<boolean>> =>
      pipe(
        collection.collection.future(c =>
          c.updateOne(
            { id: UserId.codec.encode(id) },
            { $pull: { favoriteSearches: PlatformWithPuuid.codec.encode(search) } },
          ),
        ),
        // TODO: logger.trace
        Future.map(res =>
          res.matchedCount === 1 ? Maybe.some(res.modifiedCount === 1) : Maybe.none,
        ),
      ),

    removeAllFavoriteSearches: (searches: NonEmptyArray<PlatformWithPuuid>): Future<NotUsed> =>
      pipe(
        collection.collection.future(c =>
          c.updateMany(
            {},
            {
              $pull: {
                favoriteSearches: {
                  $in: NonEmptyArray.codec(PlatformWithPuuid.codec).encode(searches),
                },
              } as PullOperator<UserOutput>,
            },
          ),
        ),
        // TODO: logger.trace
        Future.map(toNotUsed),
      ),
  }
}

export { UserPersistence }
