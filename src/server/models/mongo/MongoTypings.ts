import type { IndexDirection, IndexDescription as MongoIndexDescription } from 'mongodb'
import type { OverrideProperties } from 'type-fest'

export type WithoutProjection<T> = T & {
  fields?: undefined
  projection?: undefined
}

export type IndexDescription<A> = OverrideProperties<
  MongoIndexDescription,
  {
    key: {
      [B in keyof A]?: IndexDirection
    }
  }
>
