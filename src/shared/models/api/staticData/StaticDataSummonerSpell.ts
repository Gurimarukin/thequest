import * as C from 'io-ts/Codec'

import { SummonerSpellId } from '../summonerSpell/SummonerSpellId'
import { SummonerSpellKey } from '../summonerSpell/SummonerSpellKey'

type StaticDataSummonerSpell = C.TypeOf<typeof codec>

const codec = C.struct({
  id: SummonerSpellId.codec,
  key: SummonerSpellKey.codec,
  name: C.string,
  description: C.string,
  cooldown: C.number,
})

const StaticDataSummonerSpell = { codec }

export { StaticDataSummonerSpell }
