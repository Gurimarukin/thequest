import { pipe } from 'fp-ts/function'

import { DayJs } from '../../../shared/models/DayJs'
import { Future, toNotUsed } from '../../../shared/utils/fp'

import type { Migration } from '../../models/migration/Migration'
import type { MongoCollectionGetter } from '../../models/mongo/MongoCollection'
import { MigrationUtils } from './MigrationUtils'

export const Migration20250620 = (mongoCollection: MongoCollectionGetter): Migration => ({
  createdAt: DayJs.of('2025-06-200T09:14:43Z'),
  migrate: pipe(
    MigrationUtils.dropCollection(mongoCollection, 'leagueEntry'),
    Future.map(toNotUsed),
  ),
})
