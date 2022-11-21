import type { Codec } from 'io-ts/Codec'
import * as C from 'io-ts/Codec'
import type { Decoder } from 'io-ts/Decoder'
import * as D from 'io-ts/Decoder'
import type { Encoder } from 'io-ts/Encoder'
import * as E from 'io-ts/Encoder'
import type { Literal } from 'io-ts/Schemable'

import { NonEmptyArray } from './fp'

type Enum<A extends NonEmptyArray<Literal>> = {
  readonly values: A
  readonly decoder: Decoder<unknown, A[number]>
  readonly encoder: Encoder<A[number], A[number]>
  readonly codec: Codec<unknown, A[number], A[number]>
  readonly T: A[number]
}

export const createEnum = <A extends NonEmptyArray<Literal>>(...values: A): Enum<A> => {
  const [head, tail] = NonEmptyArray.unprepend(values)
  const decoder = D.union(C.literal(head), ...tail.map(v => C.literal(v)))
  const encoder = E.id<A[number]>()
  const codec = C.make(decoder, encoder)

  const res: Omit<Enum<A>, 'T'> = { values, decoder, encoder, codec }
  return res as Enum<A>
}
