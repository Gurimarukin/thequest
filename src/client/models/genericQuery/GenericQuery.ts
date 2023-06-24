import { pipe } from 'fp-ts/function'
import { lens } from 'monocle-ts'

import type { MyPartial } from '../../../shared/models/MyPartial'
import { Dict, Maybe } from '../../../shared/utils/fp'

import type { PartialGenericQuery } from './PartialGenericQuery'

type GenericQuery = {
  search: Maybe<string>
}

const fromPartial = (partial: PartialGenericQuery): GenericQuery => ({
  search: Maybe.fromNullable(partial.search),
})

const toPartial = (query: GenericQuery): PartialGenericQuery => {
  const res: MyPartial<PartialGenericQuery> = {
    search: Maybe.toUndefined(query.search),
  }
  return pipe(
    res,
    Dict.filter(val => val !== undefined),
  )
}

const Lens = {
  search: pipe(lens.id<GenericQuery>(), lens.prop('search')),
}

const GenericQuery = { fromPartial, toPartial, Lens }

export { GenericQuery }
