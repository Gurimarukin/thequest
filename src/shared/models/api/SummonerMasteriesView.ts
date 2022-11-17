import * as C from 'io-ts/Codec'

import { List } from '../../utils/fp'
import { ChampionMasteryView } from './ChampionMasteryView'
import { SummonerId } from './SummonerId'

type SummonerMasteriesView = C.TypeOf<typeof codec>

const codec = C.struct({
  summoner: C.struct({
    id: SummonerId.codec,
    name: C.string,
    profileIconId: C.number,
    summonerLevel: C.number,
  }),
  masteries: List.codec(ChampionMasteryView.codec),
})

const SummonerMasteriesView = { codec }

export { SummonerMasteriesView }
