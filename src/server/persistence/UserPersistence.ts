import { pipe } from 'fp-ts/function'

import { UserName } from '../../shared/models/api/user/UserName'
import type { Maybe, NotUsed } from '../../shared/utils/fp'
import { Future } from '../../shared/utils/fp'

import { FpCollection } from '../helpers/FpCollection'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
import type { MongoCollectionGetter } from '../models/mongo/MongoCollection'
import { User } from '../models/user/User'

type UserPersistence = ReturnType<typeof UserPersistence>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function UserPersistence(Logger: LoggerGetter, mongoCollection: MongoCollectionGetter) {
  const logger = Logger('UserPersistence')
  const collection = FpCollection(logger)([User.codec, 'WebUser'])(mongoCollection('user'))

  const ensureIndexes: Future<NotUsed> = collection.ensureIndexes([
    { key: { id: -1 }, unique: true },
    { key: { userName: -1 }, unique: true },
  ])

  return {
    ensureIndexes,

    findByUserName: (userName: UserName): Future<Maybe<User>> =>
      collection.findOne({ userName: UserName.codec.encode(userName) }),

    create: (user: User): Future<boolean> =>
      pipe(
        collection.insertOne(user),
        Future.map(r => r.acknowledged),
      ),
  }
}

export { UserPersistence }
