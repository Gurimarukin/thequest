import { pipe } from 'fp-ts/function'

import { DayJs } from '../../../shared/models/DayJs'
import { Future, toNotUsed } from '../../../shared/utils/fp'

import type { Migration } from '../../models/migration/Migration'
import type { MongoCollectionGetter } from '../../models/mongo/MongoCollection'

export const Migration20250619 = (mongoCollection: MongoCollectionGetter): Migration => ({
  createdAt: DayJs.of('2025-06-19T20:30:58Z'),
  migrate: pipe(
    mongoCollection('leagueEntry').future(c => c.dropIndexes()),
    Future.map(toNotUsed),
  ),
})
