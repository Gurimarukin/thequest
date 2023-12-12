import { pipe } from 'fp-ts/function'

import { DayJs } from '../../../shared/models/DayJs'
import { Future, toNotUsed } from '../../../shared/utils/fp'

import type { Migration } from '../../models/migration/Migration'
import type { MongoCollectionGetter } from '../../models/mongo/MongoCollection'

export const Migration20231212 = (mongoCollection: MongoCollectionGetter): Migration => ({
  createdAt: DayJs.of('2023-12-12T16:45:33Z'),
  migrate: pipe(
    mongoCollection('user').future(coll => coll.updateMany({}, { $set: { role: 'base' } })),
    Future.map(toNotUsed),
  ),
})
