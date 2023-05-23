import { pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'
import { lens } from 'monocle-ts'

import { List, Maybe } from '../../../utils/fp'
import { ChampionMasteryView } from '../ChampionMasteryView'
import { ChampionShardsView } from './ChampionShardsView'
import { SummonerLeaguesView } from './SummonerLeaguesView'
import { SummonerView } from './SummonerView'

type SummonerMasteriesView = C.TypeOf<typeof codec>

const codec = C.struct({
  summoner: SummonerView.codec,
  leagues: SummonerLeaguesView.codec,
  masteries: List.codec(ChampionMasteryView.codec),
  championShards: Maybe.codec(List.codec(ChampionShardsView.codec)), // some if user connected
})

const Lens = {
  championShards: pipe(lens.id<SummonerMasteriesView>(), lens.prop('championShards'), lens.some),
}

const SummonerMasteriesView = { codec, Lens }

export { SummonerMasteriesView }
