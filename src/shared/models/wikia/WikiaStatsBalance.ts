import * as C from 'io-ts/Codec'

import { StrictPartial } from '../../../server/utils/ioTsUtils'

type WikiaStatsBalance = C.TypeOf<typeof codec>

const codec = StrictPartial.codec({
  dmg_dealt: C.number,
  dmg_taken: C.number,
  attack_speed: C.number,
  energy_regen: C.number,
  healing: C.number,
  shielding: C.number,
  ability_haste: C.number,
  tenacity: C.number,
  movement_speed: C.number,
})

const WikiaStatsBalance = { codec }

export { WikiaStatsBalance }
