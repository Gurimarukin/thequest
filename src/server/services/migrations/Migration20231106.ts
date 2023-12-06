import { pipe } from 'fp-ts/function'

import { DayJs } from '../../../shared/models/DayJs'
import { Future, toNotUsed } from '../../../shared/utils/fp'

import type { Migration } from '../../models/migration/Migration'
import type { MongoCollectionGetter } from '../../models/mongo/MongoCollection'
import { MigrationUtils } from './MigrationUtils'

export const Migration20231106 = (mongoCollection: MongoCollectionGetter): Migration => ({
  createdAt: DayJs.of('2023-11-06T18:42:13Z'),
  migrate: pipe(
    MigrationUtils.dropCollection(mongoCollection, 'poroActiveGame'),
    Future.map(toNotUsed),
  ),
})
