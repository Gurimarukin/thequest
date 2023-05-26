import * as C from 'io-ts/Codec'

import { List } from '../../../utils/fp'
import { DDragonVersion } from '../DDragonVersion'
import { StaticDataSummonerSpell } from './StaticDataSummonerSpell'

type AdditionalStaticData = C.TypeOf<typeof codec>

const codec = C.struct({
  version: DDragonVersion.codec,
  summonerSpells: List.codec(StaticDataSummonerSpell.codec),
})

const AdditionalStaticData = { codec }

export { AdditionalStaticData }
