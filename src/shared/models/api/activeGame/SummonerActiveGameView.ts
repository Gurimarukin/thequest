import { pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'
import { lens, optional } from 'monocle-ts'

import { Maybe } from '../../../utils/fp'
import { SummonerShort } from '../summoner/SummonerShort'
import { ActiveGameView } from './ActiveGameView'

type SummonerActiveGameView = C.TypeOf<typeof codec>

const codec = C.struct({
  summoner: SummonerShort.codec,
  game: Maybe.codec(ActiveGameView.codec),
})

const Lens = {
  game: {
    participants: pipe(
      lens.id<SummonerActiveGameView>(),
      lens.prop('game'),
      lens.some,
      optional.prop('participants'),
    ),
  },
}

const SummonerActiveGameView = { codec, Lens }

export { SummonerActiveGameView }
