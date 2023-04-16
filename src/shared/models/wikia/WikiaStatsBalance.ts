import { string } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'
import * as D from 'io-ts/Decoder'

import { StrictPartial } from '../../../server/utils/ioTsUtils'

import { createEnum } from '../../utils/createEnum'
import type { Tuple } from '../../utils/fp'
import { Dict, List } from '../../utils/fp'

type WikiaStatsBalance = C.TypeOf<typeof rawCodec>

const rawCodec = StrictPartial.codec({
  dmg_dealt: C.number,
  dmg_taken: C.number,
  attack_speed: C.number,
  energy_regen: C.number,
  healing: C.number,
  shielding: C.number,
  ability_haste: C.number, // 20, -10
  tenacity: C.number,
  movement_speed: C.number,
})

type PercentsStats = typeof PercentsStats.T

const PercentsStats = createEnum(
  'dmg_dealt',
  'dmg_taken',
  'attack_speed',
  'energy_regen',
  'healing',
  'shielding',
  'tenacity',
  'movement_speed',
)

const toReadonlyArray = Dict.toReadonlyArray as (
  stats: WikiaStatsBalance,
) => List<Tuple<keyof WikiaStatsBalance, WikiaStatsBalance[keyof WikiaStatsBalance]>>

/**
 * maps only keys which are percents: 1.0, 1.2, 0.8
 */
const mapPercentsStats = <B>(
  f: (key: PercentsStats, a: Exclude<WikiaStatsBalance[PercentsStats], undefined>) => B,
): ((stats: WikiaStatsBalance) => {
  [K in keyof WikiaStatsBalance]: K extends PercentsStats ? B : WikiaStatsBalance[K]
}) =>
  flow(
    toReadonlyArray,
    List.reduce(
      {} as { [K in keyof WikiaStatsBalance]: K extends PercentsStats ? B : WikiaStatsBalance[K] },
      (acc, [key, val]) =>
        val === undefined
          ? acc
          : {
              [key]: List.elem(string.Eq)(key, PercentsStats.values)
                ? f(key as PercentsStats, val)
                : val,
            },
    ),
  )

const codec = C.make(
  pipe(rawCodec, D.map(mapPercentsStats(({}, n) => (n === 1 ? undefined : n)))),
  rawCodec,
)

const WikiaStatsBalance = { codec, mapPercentsStats, toReadonlyArray }

export { WikiaStatsBalance }
