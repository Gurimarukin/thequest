import type { IndexDirection, IndexDescription as MongoIndexDescription } from 'mongodb'

import type { Override } from '../../../shared/models/typeFest'

export type WithoutProjection<T> = T & {
  fields?: undefined
  projection?: undefined
}

export type IndexDescription<A> = Override<
  MongoIndexDescription,
  'key',
  {
    [B in keyof A]?: IndexDirection
  }
>
