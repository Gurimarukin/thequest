import { pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'
import { lens } from 'monocle-ts'

import { List, Maybe } from '../../../utils/fp'
import { DayJsFromISOString } from '../../../utils/ioTsUtils'
import { MsDuration } from '../../MsDuration'
import { ChampionMasteryView } from '../ChampionMasteryView'
import { ChampionShardsView } from './ChampionShardsView'
import { SummonerLeaguesView } from './SummonerLeaguesView'
import { SummonerView } from './SummonerView'

type SummonerMasteriesView = C.TypeOf<typeof codec>

const codec = C.struct({
  summoner: SummonerView.codec,
  leagues: SummonerLeaguesView.codec,
  masteries: C.struct({
    champions: List.codec(ChampionMasteryView.codec),
    insertedAt: DayJsFromISOString.codec,
    cacheDuration: MsDuration.codec,
  }),
  championShards: Maybe.codec(List.codec(ChampionShardsView.codec)), // some if user connected
})

const Lens = {
  championShards: pipe(lens.id<SummonerMasteriesView>(), lens.prop('championShards'), lens.some),
}

const SummonerMasteriesView = { codec, Lens }

export { SummonerMasteriesView }
