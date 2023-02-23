import * as C from 'io-ts/Codec'

import { List, Maybe } from '../../../utils/fp'
import { ChampionMasteryView } from '../ChampionMasteryView'
import { SummonerView } from './SummonerView'

type SummonerMasteriesView = Readonly<C.TypeOf<typeof codec>>

const codec = C.struct({
  summoner: SummonerView.codec,
  masteries: List.codec(ChampionMasteryView.codec),
  championShards: Maybe.codec(C.record(C.number)),
})

const SummonerMasteriesView = { codec }

export { SummonerMasteriesView }
