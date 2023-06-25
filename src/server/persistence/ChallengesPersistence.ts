import { pipe } from 'fp-ts/function'

import type { DayJs } from '../../shared/models/DayJs'
import { Puuid } from '../../shared/models/api/summoner/Puuid'
import type { Maybe, NotUsed } from '../../shared/utils/fp'
import { Future } from '../../shared/utils/fp'

import { FpCollection } from '../helpers/FpCollection'
import { ChallengesDb } from '../models/challenges/ChallengesDb'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
import type { MongoCollectionGetter } from '../models/mongo/MongoCollection'
import { DayJsFromDate } from '../utils/ioTsUtils'

type ChallengesPersistence = ReturnType<typeof ChallengesPersistence>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const ChallengesPersistence = (Logger: LoggerGetter, mongoCollection: MongoCollectionGetter) => {
  const logger = Logger('ChallengesPersistence')
  const collection = FpCollection(logger)([ChallengesDb.codec, 'ChallengesDb'])(
    mongoCollection('challenges'),
  )

  const ensureIndexes: Future<NotUsed> = collection.ensureIndexes([
    { key: { puuid: -1 }, unique: true },
  ])

  return {
    ensureIndexes,

    findBySummoner: (puuid: Puuid, insertedAfter: DayJs): Future<Maybe<ChallengesDb>> =>
      collection.findOne({
        puuid: Puuid.codec.encode(puuid),
        insertedAt: { $gte: DayJsFromDate.codec.encode(insertedAfter) },
      }),

    upsert: (challenges: ChallengesDb): Future<boolean> =>
      pipe(
        collection.updateOne({ puuid: Puuid.codec.encode(challenges.puuid) }, challenges, {
          upsert: true,
        }),
        Future.map(r => r.modifiedCount + r.upsertedCount <= 1),
      ),
  }
}

export { ChallengesPersistence }
