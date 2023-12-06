import { pipe } from 'fp-ts/function'

import { DayJs } from '../../../shared/models/DayJs'
import { Future, toNotUsed } from '../../../shared/utils/fp'

import type { Migration } from '../../models/migration/Migration'
import type { MongoCollectionGetter } from '../../models/mongo/MongoCollection'
import { MigrationUtils } from './MigrationUtils'

export const Migration20230925 = (mongoCollection: MongoCollectionGetter): Migration => ({
  createdAt: DayJs.of('2023-09-25T20:53:56Z'),
  migrate: pipe(
    MigrationUtils.dropCollection(mongoCollection, 'activeGame'),
    Future.map(toNotUsed),
  ),
})
