import { pipe } from 'fp-ts/function'
import type { Codec } from 'io-ts/Codec'
import * as C from 'io-ts/Codec'

import { createEnum } from '../../../utils/createEnum'
import { NumberFromString } from '../../../utils/ioTsUtils'

type ChampionLevel = typeof e.T

const e = createEnum(0, 1, 2, 3, 4, 5, 6, 7)

const stringCodec: Codec<unknown, string, ChampionLevel> = pipe(
  NumberFromString.codec,
  C.compose(e.codec),
)

const stringify = String as (level: ChampionLevel) => `${ChampionLevel}`

const ChampionLevel = {
  codec: e.codec,
  values: e.values,
  stringCodec,
  stringify,
  Eq: e.Eq,
  Ord: e.Ord,
}

export { ChampionLevel }
