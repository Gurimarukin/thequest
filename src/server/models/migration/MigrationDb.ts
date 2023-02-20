import { pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'
import * as D from 'io-ts/Decoder'

import { DayJsFromISOString } from '../../../shared/utils/ioTsUtils'

type MigrationDb = Readonly<C.TypeOf<typeof codec>>

const createdAtCodec = C.struct({
  createdAt: DayJsFromISOString.codec,
})

const codec = pipe(
  createdAtCodec,
  C.intersect(
    C.struct({
      appliedAt: DayJsFromISOString.codec,
    }),
  ),
)

const MigrationDb = { codec }

const MigrationCreatedAt = {
  decoder: pipe(
    createdAtCodec,
    D.map(a => a.createdAt),
  ),
}

export { MigrationDb, MigrationCreatedAt }
