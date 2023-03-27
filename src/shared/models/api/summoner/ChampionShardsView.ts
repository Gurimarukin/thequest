import { eq } from 'fp-ts'
import type { Eq } from 'fp-ts/Eq'
import { pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'

import { Maybe } from '../../../utils/fp'
import { ChampionKey } from '../ChampionKey'
import { ShardsToRemoveFromNotification } from './ShardsToRemoveFromNotification'

type ChampionShardsView = Readonly<C.TypeOf<typeof codec>>

const codec = C.struct({
  champion: ChampionKey.codec,
  count: C.number,
  shardsToRemoveFromNotification: Maybe.codec(ShardsToRemoveFromNotification.codec),
})

const byChampionEq: Eq<ChampionShardsView> = pipe(
  ChampionKey.Eq,
  eq.contramap(s => s.champion),
)

const ChampionShardsView = { codec, Eq: { byChampion: byChampionEq } }

export { ChampionShardsView }
