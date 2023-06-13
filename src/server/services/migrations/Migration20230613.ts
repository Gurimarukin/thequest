import { pipe } from 'fp-ts/function'
import { MongoServerError } from 'mongodb'

import { DayJs } from '../../../shared/models/DayJs'
import type { Dict } from '../../../shared/utils/fp'
import { Future, toNotUsed } from '../../../shared/utils/fp'

import type { Migration } from '../../models/migration/Migration'
import type { MongoCollectionGetter } from '../../models/mongo/MongoCollection'

export const Migration20230613 = (mongoCollection: MongoCollectionGetter): Migration => ({
  createdAt: DayJs.of('2023-06-13T09:48:20Z'),
  migrate: pipe(
    mongoCollection<Dict<string, never>>('activeGame').future(coll => coll.drop()),
    Future.orElse(e =>
      e instanceof MongoServerError && e.message === 'ns not found'
        ? Future.successful(true)
        : Future.failed(e),
    ),
    Future.map(toNotUsed),
  ),
})
