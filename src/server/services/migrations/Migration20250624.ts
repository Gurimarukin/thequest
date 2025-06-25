import { pipe } from 'fp-ts/function'

import { DayJs } from '../../../shared/models/DayJs'
import { Future, toNotUsed } from '../../../shared/utils/fp'

import type { Migration } from '../../models/migration/Migration'
import type { MongoCollectionGetter } from '../../models/mongo/MongoCollection'
import { MigrationUtils } from './MigrationUtils'

export const Migration20250624 = (mongoCollection: MongoCollectionGetter): Migration => ({
  createdAt: DayJs.of('2025-06-24T23:34:10Z'),
  migrate: pipe(MigrationUtils.dropCollection(mongoCollection, 'summoner'), Future.map(toNotUsed)),
})
