import { pipe } from 'fp-ts/function'

import { DayJs } from '../../../shared/models/DayJs'
import { Future, toNotUsed } from '../../../shared/utils/fp'

import type { Migration } from '../../models/migration/Migration'
import type { MongoCollectionGetter } from '../../models/mongo/MongoCollection'

export const Migration20240401 = (mongoCollection: MongoCollectionGetter): Migration => ({
  createdAt: DayJs.of('2024-04-01T14:29:45Z'),
  migrate: pipe(
    mongoCollection('summoner').future(c => c.dropIndexes()),
    Future.map(toNotUsed),
  ),
})
