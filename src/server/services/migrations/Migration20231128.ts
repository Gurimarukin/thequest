import { apply } from 'fp-ts'
import { pipe } from 'fp-ts/function'

import { DayJs } from '../../../shared/models/DayJs'
import { Future, toNotUsed } from '../../../shared/utils/fp'

import type { Migration } from '../../models/migration/Migration'
import type { MongoCollectionGetter } from '../../models/mongo/MongoCollection'
import { MigrationUtils } from './MigrationUtils'

export const Migration20231128 = (mongoCollection: MongoCollectionGetter): Migration => ({
  createdAt: DayJs.of('2023-11-28T22:14:56Z'),
  migrate: pipe(
    apply.sequenceT(Future.ApplyPar)(
      MigrationUtils.dropCollection(mongoCollection, 'activeGame'),
      MigrationUtils.dropCollection(mongoCollection, 'championMastery'),
      MigrationUtils.dropCollection(mongoCollection, 'poroActiveGame'),
      MigrationUtils.dropCollection(mongoCollection, 'riotAccount'),
    ),
    Future.map(toNotUsed),
  ),
})
