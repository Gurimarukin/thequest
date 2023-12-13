import { pipe } from 'fp-ts/function'
import type { AnyBulkWriteOperation } from 'mongodb'

import { Puuid } from '../../shared/models/api/summoner/Puuid'
import { DiscordUserId } from '../../shared/models/discord/DiscordUserId'
import type { TObservable } from '../../shared/models/rx/TObservable'
import type { NotUsed } from '../../shared/utils/fp'
import { Future, List, NonEmptyArray } from '../../shared/utils/fp'

import { FpCollection } from '../helpers/FpCollection'
import type { HallOfFameMemberOutput } from '../models/HallOfFameMember'
import { HallOfFameMember } from '../models/HallOfFameMember'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
import type { MongoCollectionGetter } from '../models/mongo/MongoCollection'
import type { ToDeleteAndToUpsert } from '../models/mongo/ToDeleteAndToUpsert'

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

  const listAll: TObservable<HallOfFameMember> = collection.findAll()({})

  return {
    ensureIndexes,

    listAll,

    bulkDeleteAndUpsert: ({
      toDelete,
      toUpsert,
    }: ToDeleteAndToUpsert<HallOfFameMember>): Future<boolean> => {
      const operations: List<AnyBulkWriteOperation<HallOfFameMemberOutput>> = pipe(
        toDelete,
        List.map(
          (m): AnyBulkWriteOperation<HallOfFameMemberOutput> => ({
            deleteMany: {
              filter: {
                userId: DiscordUserId.codec.encode(m.userId),
                puuid: Puuid.codec.encode(m.puuid),
              },
            },
          }),
        ),

        List.concat(
          pipe(
            toUpsert,
            List.map((m): AnyBulkWriteOperation<HallOfFameMemberOutput> => {
              const {
                userId: encodedUserId,
                puuid: encodedPuuid,
                ...$set
              } = HallOfFameMember.codec.encode(m)
              return {
                updateOne: {
                  filter: {
                    userId: encodedUserId,
                    puuid: encodedPuuid,
                  },
                  update: { $set },
                  upsert: true,
                },
              }
            }),
          ),
        ),
      )

      return !List.isNonEmpty(operations)
        ? Future.successful(true)
        : pipe(
            collection.collection.future(c =>
              c.bulkWrite(NonEmptyArray.asMutable(operations), { ordered: false }),
            ),
            Future.map(
              r =>
                r.deletedCount <= toDelete.length &&
                r.modifiedCount + r.upsertedCount <= toUpsert.length,
            ),
          )
    },
  }
}

export { HallOfFameMemberPersistence }
