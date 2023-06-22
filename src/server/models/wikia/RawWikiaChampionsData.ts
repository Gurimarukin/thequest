import { pipe } from 'fp-ts/function'
import type { Decoder } from 'io-ts/Decoder'
import * as D from 'io-ts/Decoder'
import { Table } from 'lua-in-js'

type RawWikiaChampionsData = D.TypeOf<typeof decoder>

const tableDecoder: Decoder<unknown, unknown[] | Record<string, unknown>> = pipe(
  D.id<unknown>(),
  D.parse(i => (i instanceof Table ? D.success(i) : D.failure(i, 'Table'))),
  D.map(t => t.toObject()),
)

const decoder = pipe(tableDecoder, D.compose(D.UnknownRecord))

const RawWikiaChampionsData = { decoder }

export { RawWikiaChampionsData }
