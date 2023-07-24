import { pipe } from 'fp-ts/function'
import { MongoServerError } from 'mongodb'

import { DayJs } from '../../../shared/models/DayJs'
import type { Dict } from '../../../shared/utils/fp'
import { Future, toNotUsed } from '../../../shared/utils/fp'

import type { Migration } from '../../models/migration/Migration'
import type { MongoCollectionGetter } from '../../models/mongo/MongoCollection'

export const Migration20230724 = (mongoCollection: MongoCollectionGetter): Migration => ({
  createdAt: DayJs.of('2023-07-24T12:09:10Z'),
  migrate: pipe(
    mongoCollection<Dict<string, never>>('leagueEntry').future(coll => coll.drop()),
    Future.orElse(e =>
      e instanceof MongoServerError && e.message === 'ns not found'
        ? Future.successful(true)
        : Future.failed(e),
    ),
    Future.map(toNotUsed),
  ),
})
