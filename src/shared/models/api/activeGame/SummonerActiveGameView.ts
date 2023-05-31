import { pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'
import { lens } from 'monocle-ts'

import { SummonerShort } from '../summoner/SummonerShort'
import { ActiveGameView } from './ActiveGameView'

type SummonerActiveGameView = C.TypeOf<typeof codec>

const codec = C.struct({
  summoner: SummonerShort.codec,
  game: ActiveGameView.codec,
})

const Lens = {
  game: {
    participants: pipe(
      lens.id<SummonerActiveGameView>(),
      lens.prop('game'),
      lens.prop('participants'),
    ),
  },
}

const SummonerActiveGameView = { codec, Lens }

export { SummonerActiveGameView }
