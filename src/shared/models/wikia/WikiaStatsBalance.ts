import type { eq } from 'fp-ts'
import { string } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import type { Codec } from 'io-ts/Codec'
import * as C from 'io-ts/Codec'
import * as D from 'io-ts/Decoder'

import type { Dict } from '../../utils/fp'
import { List, PartialDict } from '../../utils/fp'
import { StrictPartial } from '../../utils/ioTsUtils'

type WikiaStatsBalance = C.TypeOf<typeof rawCodec>

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

const codec: Codec<unknown, C.OutputOf<typeof rawCodec>, WikiaStatsBalance> = C.make(
  pipe(
    rawCodec,
    D.map(
      flow(
        PartialDict.toReadonlyArray,
        List.reduce({} as WikiaStatsBalance, (acc, [key, val]) => {
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

const Eq: eq.Eq<Key> = string.Eq

type Key = keyof WikiaStatsBalance

const keys = Object.keys(properties) as List<Key>

const modifierStats: List<Key> = [
  'dmg_dealt',
  'dmg_taken',
  'healing',
  'shielding',
  'energy_regen',
  'attack_speed',
  'movement_speed',
  'tenacity',
]

const percentsStats: List<Key> = pipe(modifierStats, List.difference(Eq)(['tenacity']))

const malusStats: List<Key> = ['dmg_taken']

const isModifierStat = (stat: Key): boolean => List.elem(Eq)(stat, modifierStats)

const isPercentsStat = (stat: Key): boolean => List.elem(Eq)(stat, percentsStats)

const isMalusStat = (stat: Key): boolean => List.elem(Eq)(stat, malusStats)

const label: Dict<Key, string> = {
  dmg_dealt: 'Damage dealt',
  dmg_taken: 'Damage taken',
  healing: 'Healing',
  shielding: 'Shielding',
  ability_haste: 'Ability haste',
  energy_regen: 'Energy regeneration',
  attack_speed: 'Attack speed',
  movement_speed: 'Movement speed',
  tenacity: 'Tenacity',
}

const WikiaStatsBalance = {
  keys,
  codec,
  isModifierStat,
  isPercentsStat,
  isMalusStat,
  label,
  Eq,
}

export { WikiaStatsBalance, type Key as WikiaStatsBalanceKey }
