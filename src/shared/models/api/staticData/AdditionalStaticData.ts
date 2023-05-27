import * as C from 'io-ts/Codec'

import { List } from '../../../utils/fp'
import { DDragonVersion } from '../DDragonVersion'
import { StaticDataRune } from './StaticDataRune'
import { StaticDataRuneStyle } from './StaticDataRuneStyle'
import { StaticDataSummonerSpell } from './StaticDataSummonerSpell'

type AdditionalStaticData = C.TypeOf<typeof codec>

const codec = C.struct({
  version: DDragonVersion.codec,
  summonerSpells: List.codec(StaticDataSummonerSpell.codec),
  runeStyles: List.codec(StaticDataRuneStyle.codec),
  runes: List.codec(StaticDataRune.codec),
})

const AdditionalStaticData = { codec }

export { AdditionalStaticData }
