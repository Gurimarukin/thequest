import { pipe } from 'fp-ts/function'
import type { Decoder } from 'io-ts/Decoder'
import type { PullOperator } from 'mongodb'

import { PlatformWithPuuid } from '../../shared/models/api/summoner/PlatformWithPuuid'
import { Puuid } from '../../shared/models/api/summoner/Puuid'
import { UserName } from '../../shared/models/api/user/UserName'
import { DiscordUserId } from '../../shared/models/discord/DiscordUserId'
import type { NotUsed } from '../../shared/utils/fp'
import { Future, List, Maybe, NonEmptyArray, Tuple, toNotUsed } from '../../shared/utils/fp'

import { FpCollection, FpCollectionHelpers } from '../helpers/FpCollection'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
import type { MongoCollectionGetter } from '../models/mongo/MongoCollection'
import type { UserOutput } from '../models/user/User'
import { User } from '../models/user/User'
import { UserId } from '../models/user/UserId'
import type { UserLoginDiscord } from '../models/user/UserLogin'
import { UserLogin, UserLoginPassword } from '../models/user/UserLogin'

const { getPath } = FpCollectionHelpers

const Keys = {
  loginDiscordId: getPath<User<UserLoginDiscord>>()('login', 'id'),
  loginPasswordDiscordId: getPath<User<UserLoginPassword>>()('login', 'discord', 'id'),
  loginPasswordUserName: getPath<User<UserLoginPassword>>()('login', 'userName'),
}

type UserPersistence = ReturnType<typeof UserPersistence>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function UserPersistence(Logger: LoggerGetter, mongoCollection: MongoCollectionGetter) {
  const logger = Logger('UserPersistence')
  const collection = FpCollection(logger)([User.codec, 'User<UserLogin>'])(mongoCollection('user'))

  const ensureIndexes: Future<NotUsed> = collection.ensureIndexes([
    { key: { id: -1 }, unique: true },
    { key: { [Keys.loginPasswordUserName]: -1 } },
  ])

  return {
    ensureIndexes,

    findByLoginDiscordId: (id: DiscordUserId): Future<Maybe<User<UserLogin>>> => {
      const encoded = DiscordUserId.codec.encode(id)
      return collection.findOne({
        $or: [{ [Keys.loginDiscordId]: encoded }, { [Keys.loginPasswordDiscordId]: encoded }],
      })
    },

    findByLoginUserName: (userName: UserName): Future<Maybe<User<UserLoginPassword>>> =>
      collection.findOne(
        { [Keys.loginPasswordUserName]: UserName.codec.encode(userName) },
        {},
        userLoginPasswordDecoderWithName,
      ),

    findById: (id: UserId): Future<Maybe<User<UserLogin>>> =>
      collection.findOne({ id: UserId.codec.encode(id) }),

    create: (user: User<UserLogin>): Future<boolean> =>
      pipe(
        collection.insertOne(user),
        Future.map(r => r.acknowledged),
      ),

    updateLoginDiscord: (id: UserId, login: UserLogin): Future<boolean> =>
      pipe(
        collection.collection.future(c =>
          c.updateOne(
            { id: UserId.codec.encode(id) },
            { $set: { login: UserLogin.codec.encode(login) } },
          ),
        ),
        // TODO: logger.trace
        Future.map(r => r.modifiedCount <= 1),
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
    removeFavoriteSearch: (id: UserId, puuid: Puuid): Future<Maybe<boolean>> =>
      pipe(
        collection.collection.future(c =>
          c.updateOne(
            { id: UserId.codec.encode(id) },
            { $pull: { favoriteSearches: { puuid: Puuid.codec.encode(puuid) } } },
          ),
        ),
        // TODO: logger.trace
        Future.map(res =>
          res.matchedCount === 1 ? Maybe.some(res.modifiedCount === 1) : Maybe.none,
        ),
      ),

    removeAllFavoriteSearches: (id: UserId, searches: List<PlatformWithPuuid>): Future<NotUsed> =>
      !List.isNonEmpty(searches)
        ? Future.notUsed
        : pipe(
            collection.collection.future(c =>
              c.updateMany(
                { id: UserId.codec.encode(id) },
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

const userLoginPasswordDecoderWithName: Tuple<
  Decoder<unknown, User<UserLoginPassword>>,
  string
> = Tuple.of(User.decoder(UserLoginPassword.codec), 'User<UserLoginPassword>')
