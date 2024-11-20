import type { eq } from 'fp-ts'
import { string } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import type { Codec } from 'io-ts/Codec'
import * as C from 'io-ts/Codec'
import * as D from 'io-ts/Decoder'

import { DictUtils } from '../utils/DictUtils'
import { List } from '../utils/fp'
import { StrictPartial } from '../utils/ioTsUtils'

type WikiStatsBalance = C.TypeOf<typeof rawCodec>

const properties = {
  dmg_dealt: C.number,
  dmg_taken: C.number,
  healing: C.number,
  shielding: C.number,
  ability_haste: C.number, // 20, -10
  energy_regen: C.number,
  attack_speed: C.number,
  movement_speed: C.number,
  tenacity: C.number,
}

const rawCodec = StrictPartial.codec(properties)

const codec: Codec<unknown, C.OutputOf<typeof rawCodec>, WikiStatsBalance> = C.make(
  pipe(
    rawCodec,
    D.map(
      flow(
        DictUtils.partial.entries,
        List.reduce({} as WikiStatsBalance, (acc, [key, val]) => {
          if (val === undefined) return acc
          if (isModifierStat(key)) {
            if (val === 1) return acc
          } else {
            if (val === 0) return acc
          }
          return { ...acc, [key]: val }
        }),
      ),
    ),
  ),
  rawCodec,
)

const Eq: eq.Eq<WikiStatsBalanceKey> = string.Eq

type WikiStatsBalanceKey = keyof WikiStatsBalance

const keys = DictUtils.keys(properties)

const modifierStats: List<WikiStatsBalanceKey> = [
  'dmg_dealt',
  'dmg_taken',
  'healing',
  'shielding',
  'energy_regen',
  'attack_speed',
  'movement_speed',
  'tenacity',
]

const percentsStats: List<WikiStatsBalanceKey> = pipe(
  modifierStats,
  List.difference(Eq)(['tenacity']),
)

const malusStats: List<WikiStatsBalanceKey> = ['dmg_taken']

const isModifierStat = (stat: WikiStatsBalanceKey): boolean => List.elem(Eq)(stat, modifierStats)

const isPercentsStat = (stat: WikiStatsBalanceKey): boolean => List.elem(Eq)(stat, percentsStats)

const isMalusStat = (stat: WikiStatsBalanceKey): boolean => List.elem(Eq)(stat, malusStats)

const WikiStatsBalance = {
  keys,
  codec,
  isModifierStat,
  isPercentsStat,
  isMalusStat,
  Eq,
}

export { WikiStatsBalance, WikiStatsBalanceKey }
