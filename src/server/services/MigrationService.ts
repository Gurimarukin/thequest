import { pipe } from 'fp-ts/function'

import { DayJs } from '../../shared/models/DayJs'
import type { NotUsed } from '../../shared/utils/fp'
import { Future, IO, List, Maybe, NonEmptyArray } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'

import type { LoggerGetter } from '../models/logger/LoggerGetter'
import { Migration } from '../models/migration/Migration'
import type { MongoCollectionGetter } from '../models/mongo/MongoCollection'
import type { MigrationPersistence } from '../persistence/MigrationPersistence'
import { Migration20230611 } from './migrations/Migration20230611'
import { Migration20230613 } from './migrations/Migration20230613'
import { Migration20230724 } from './migrations/Migration20230724'
import { Migration20230925 } from './migrations/Migration20230925'

export type MigrationService = ReturnType<typeof MigrationService>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const MigrationService = (
  Logger: LoggerGetter,
  mongoCollection: MongoCollectionGetter,
  migrationPersistence: MigrationPersistence,
) => {
  const logger = Logger('MigrationService')

  const migrations: List<Migration> = [
    Migration20230611(mongoCollection),
    Migration20230613(mongoCollection),
    Migration20230724(mongoCollection),
    Migration20230925(mongoCollection),
  ]

  const applyMigrations: Future<NotUsed> = pipe(
    getUnappliedMigrations(),
    Future.map(NonEmptyArray.fromReadonlyArray),
    futureMaybe.chainFirstIOEitherK(m => logger.info(`${plural('migration')(m.length)} to apply`)),
    futureMaybe.chainTaskEitherK(
      NonEmptyArray.traverse(Future.ApplicativeSeq)(migration =>
        pipe(
          logger.info(`Applying migration ${DayJs.toISOString(migration.createdAt)}`),
          Future.fromIOEither,
          Future.chain(() => migration.migrate),
          Future.chain(() => migrationPersistence.create(migration.createdAt)),
        ),
      ),
    ),
    Future.chainIOEitherK(
      Maybe.fold(
        () => logger.info('No migration to apply'),
        () => IO.notUsed,
      ),
    ),
  )

  return { applyMigrations }

  function getUnappliedMigrations(): Future<List<Migration>> {
    return pipe(
      migrationPersistence.alreadyApplied,
      Future.map(applied =>
        pipe(
          migrations,
          List.filter(m => !pipe(applied, List.elem(DayJs.Eq)(m.createdAt))),
          List.sort(Migration.OrdCreatedAt),
        ),
      ),
    )
  }
}

/**
 * @example
 * assert.deepStrictEqual(plural('jeton')(1), '1 jeton')
 * assert.deepStrictEqual(plural('jeton')(3), '3 jetons')
 */
const plural =
  (unit: string) =>
  (n: number): string =>
    `${n.toLocaleString()} ${unit}${n < 2 ? '' : 's'}`
