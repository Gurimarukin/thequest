import { pipe } from 'fp-ts/function'

import { DayJs } from '../../../shared/models/DayJs'
import { Future, toNotUsed } from '../../../shared/utils/fp'

import type { Migration } from '../../models/migration/Migration'
import type { MongoCollectionGetter } from '../../models/mongo/MongoCollection'
import { MigrationUtils } from './MigrationUtils'

export const Migration20230724 = (mongoCollection: MongoCollectionGetter): Migration => ({
  createdAt: DayJs.of('2023-07-24T12:09:10Z'),
  migrate: pipe(
    MigrationUtils.dropCollection(mongoCollection, 'leagueEntry'),
    Future.map(toNotUsed),
  ),
})
