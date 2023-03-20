import { pipe } from 'fp-ts/function'
import type { Codec } from 'io-ts/Codec'
import * as C from 'io-ts/Codec'
import type { Decoder } from 'io-ts/Decoder'
import * as D from 'io-ts/Decoder'
import type { Encoder } from 'io-ts/Encoder'
import * as E from 'io-ts/Encoder'

const decoder: Decoder<unknown, number> = pipe(
  D.number,
  D.refine((n): n is number => Number.isInteger(n), 'Integer'),
  D.refine((n): n is number => 0 <= n && n <= 9, 'Between0And9'),
)

const encoder: Encoder<number, number> = E.id<number>()

const codec: Codec<unknown, number, number> = C.make(decoder, encoder)

const ShardsCount = { codec }

export { ShardsCount }
