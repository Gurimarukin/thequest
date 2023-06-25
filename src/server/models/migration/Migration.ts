import { ord } from 'fp-ts'
import { pipe } from 'fp-ts/function'

import { DayJs } from '../../../shared/models/DayJs'
import type { Future, NotUsed } from '../../../shared/utils/fp'

type Migration = {
  createdAt: DayJs
  migrate: Future<NotUsed>
}

const OrdCreatedAt: ord.Ord<Migration> = pipe(
  DayJs.Ord,
  ord.contramap((m: Migration) => m.createdAt),
)

const Migration = { OrdCreatedAt }

export { Migration }
