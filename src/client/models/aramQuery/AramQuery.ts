import { pipe } from 'fp-ts/function'
import { lens } from 'monocle-ts'

import type { MyPartial } from '../../../shared/models/MyPartial'
import { Dict, Maybe } from '../../../shared/utils/fp'

import type { PartialAramQuery } from './PartialAramQuery'

type AramQuery = {
  search: Maybe<string>
}

const fromPartial = (partial: PartialAramQuery): AramQuery => ({
  search: Maybe.fromNullable(partial.search),
})

const toPartial = (query: AramQuery): PartialAramQuery => {
  const res: MyPartial<PartialAramQuery> = {
    search: Maybe.toUndefined(query.search),
  }
  return pipe(
    res,
    Dict.filter(val => val !== undefined),
  )
}

const Lens = {
  search: pipe(lens.id<AramQuery>(), lens.prop('search')),
}

const AramQuery = { fromPartial, toPartial, Lens }

export { AramQuery }
