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
import { Migration20231106 } from './migrations/Migration20231106'
import { Migration20231128 } from './migrations/Migration20231128'
import { Migration20231212 } from './migrations/Migration20231212'
import { Migration20240401 } from './migrations/Migration20240401'
import { Migration20250619 } from './migrations/Migration20250619'

export type MigrationService = ReturnType<typeof MigrationService>

export const MigrationService = (
  Logger: LoggerGetter,
  mongoCollection: MongoCollectionGetter,
  migrationPersistence: MigrationPersistence,
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
) => {
  const logger = Logger('MigrationService')

  const migrations: List<Migration> = [
    Migration20230611(mongoCollection),
    Migration20230613(mongoCollection),
    Migration20230724(mongoCollection),
    Migration20230925(mongoCollection),
    Migration20231106(mongoCollection),
    Migration20231128(mongoCollection),
    Migration20231212(mongoCollection),
    Migration20240401(mongoCollection),
    Migration20250619(mongoCollection),
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
