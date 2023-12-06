import { pipe } from 'fp-ts/function'

import { DayJs } from '../../../shared/models/DayJs'
import { Future, toNotUsed } from '../../../shared/utils/fp'

import type { Migration } from '../../models/migration/Migration'
import type { MongoCollectionGetter } from '../../models/mongo/MongoCollection'
import { MigrationUtils } from './MigrationUtils'

export const Migration20230613 = (mongoCollection: MongoCollectionGetter): Migration => ({
  createdAt: DayJs.of('2023-06-13T09:48:20Z'),
  migrate: pipe(
    MigrationUtils.dropCollection(mongoCollection, 'activeGame'),
    Future.map(toNotUsed),
  ),
})
