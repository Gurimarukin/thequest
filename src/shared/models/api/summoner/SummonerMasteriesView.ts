import { pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'
import { lens, optional } from 'monocle-ts'

import { List, Maybe } from '../../../utils/fp'
import { ChampionMasteryView } from '../ChampionMasteryView'
import { ChampionShardsView } from './ChampionShardsView'
import { SummonerView } from './SummonerView'

type SummonerMasteriesView = Readonly<C.TypeOf<typeof codec>>

const codec = C.struct({
  summoner: SummonerView.codec,
  masteries: List.codec(ChampionMasteryView.codec),
  championShards: Maybe.codec(ChampionShardsView.codec), // some if user connected
})

const Lens = {
  championShards: {
    counts: pipe(
      lens.id<SummonerMasteriesView>(),
      lens.prop('championShards'),
      lens.some,
      optional.prop('counts'),
    ),
  },
}

const SummonerMasteriesView = { codec, Lens }

export { SummonerMasteriesView }
