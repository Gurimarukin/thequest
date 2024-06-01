import { eq } from 'fp-ts'
import type { Eq } from 'fp-ts/Eq'
import { pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'

import { ChampionKey } from '../champion/ChampionKey'

type ChampionShardsView = C.TypeOf<typeof codec>

const codec = C.struct({
  champion: ChampionKey.codec,
  count: C.number,
})

const byChampionEq: Eq<ChampionShardsView> = pipe(
  ChampionKey.Eq,
  eq.contramap(s => s.champion),
)

const ChampionShardsView = { codec, Eq: { byChampion: byChampionEq } }

export { ChampionShardsView }
