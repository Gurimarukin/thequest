import * as C from 'io-ts/Codec'

import { List } from '../../../utils/fp'
import { ChampionMasteryView } from '../ChampionMasteryView'
import { SummonerView } from './SummonerView'

type SummonerMasteriesView = C.TypeOf<typeof codec>

const codec = C.struct({
  summoner: SummonerView.codec,
  masteries: List.codec(ChampionMasteryView.codec),
})

const SummonerMasteriesView = { codec }

export { SummonerMasteriesView }
