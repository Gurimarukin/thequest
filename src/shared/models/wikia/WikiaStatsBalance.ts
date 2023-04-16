import { string } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import type { Codec } from 'io-ts/Codec'
import * as C from 'io-ts/Codec'
import * as D from 'io-ts/Decoder'

import { StrictPartial } from '../../../server/utils/ioTsUtils'

import { createEnum } from '../../utils/createEnum'
import type { Tuple } from '../../utils/fp'
import { Dict, List } from '../../utils/fp'

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

const keys = Dict.keys(properties)

type PercentsStats = typeof PercentsStats.T

const PercentsStats = createEnum(
  'dmg_dealt',
  'dmg_taken',
  'healing',
  'shielding',
  'energy_regen',
  'attack_speed',
  'movement_speed',
  'tenacity',
)

// Type check that PercentsStats only contains keys of WikiaStatsBalance
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type TestPercentsStats = WikiaStatsBalance[PercentsStats]

const isPercentsStats = (stat: keyof WikiaStatsBalance): stat is PercentsStats =>
  List.elem(string.Eq)(stat, PercentsStats.values)

const toReadonlyArray = Dict.toReadonlyArray as (
  stats: WikiaStatsBalance,
) => List<Tuple<keyof WikiaStatsBalance, WikiaStatsBalance[keyof WikiaStatsBalance]>>

const codec: Codec<unknown, C.OutputOf<typeof rawCodec>, WikiaStatsBalance> = C.make(
  pipe(
    rawCodec,
    D.map(
      flow(
        toReadonlyArray,
        List.reduce({} as WikiaStatsBalance, (acc, [key, val]) => {
          if (val === undefined) return acc
          if (isPercentsStats(key) && val === 1) return acc
          return { ...acc, [key]: val }
        }),
      ),
    ),
  ),
  rawCodec,
)

const label: Dict<keyof WikiaStatsBalance, string> = {
  dmg_dealt: 'dmg_dealt',
  dmg_taken: 'dmg_taken',
  healing: 'healing',
  shielding: 'shielding',
  ability_haste: 'ability_haste',
  energy_regen: 'energy_regen',
  attack_speed: 'attack_speed',
  movement_speed: 'movement_speed',
  tenacity: 'tenacity',
}

const WikiaStatsBalance = { keys, codec, isPercentsStats, toReadonlyArray, label }

export { WikiaStatsBalance, PercentsStats }
