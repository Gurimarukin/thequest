import type { eq } from 'fp-ts'
import { number } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import type { Codec } from 'io-ts/Codec'
import * as C from 'io-ts/Codec'

import { createEnum } from '../../../utils/createEnum'
import { NumberFromString } from '../../../utils/ioTsUtils'

type ChampionLevel = typeof e.T

const e = createEnum(1, 2, 3, 4, 5, 6, 7)

const Eq: eq.Eq<ChampionLevel> = number.Eq

const ChampionLevel = { codec: e.codec, Eq }

type ChampionLevelOrZero = typeof eOrZero.T

const eOrZero = createEnum(0, ...e.values)

const stringCodec: Codec<unknown, string, ChampionLevelOrZero> = pipe(
  NumberFromString.codec,
  C.compose(eOrZero.codec),
)

const stringify = String as (level: ChampionLevelOrZero) => `${ChampionLevelOrZero}`

const orZeroEq: eq.Eq<ChampionLevelOrZero> = number.Eq

const ChampionLevelOrZero = {
  codec: eOrZero.codec,
  values: eOrZero.values,
  stringCodec,
  stringify,
  Eq: orZeroEq,
}

export { ChampionLevel, ChampionLevelOrZero }
