import { pipe } from 'fp-ts/function'
import type { Codec } from 'io-ts/Codec'
import * as C from 'io-ts/Codec'

import { createEnum } from '../../../utils/createEnum'
import type { List } from '../../../utils/fp'
import { NumberFromString } from '../../../utils/ioTsUtils'

type ChampionLevel = typeof e.T

const e = createEnum(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10)

const stringCodec: Codec<unknown, string, ChampionLevel> = pipe(
  NumberFromString.codec,
  C.compose(e.codec),
)

const stringify = String as (level: ChampionLevel) => `${ChampionLevel}`

const values: List<number> = e.values

function isChampionLevel(n: number): n is ChampionLevel {
  return values.includes(n)
}

/**
 * @returns `10` if `n` is not a valid ChampionLevel
 */
function fromNumber(n: number): ChampionLevel {
  return isChampionLevel(n) ? n : 10
}

const ChampionLevel = {
  codec: e.codec,
  values: e.values,
  stringCodec,
  stringify,
  fromNumber,
  Eq: e.Eq,
  Ord: e.Ord,
}

export { ChampionLevel }
