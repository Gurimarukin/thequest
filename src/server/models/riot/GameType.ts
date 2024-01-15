import { pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'
import * as D from 'io-ts/Decoder'

import { createEnum } from '../../../shared/utils/createEnum'

type GameType = typeof e.T

const e = createEnum(
  'CUSTOM_GAME', // Custom games
  'TUTORIAL_GAME', // Tutorial games
  'MATCHED_GAME', // all other games
)

const decoder = pipe(
  D.id<unknown>(),
  D.map(res => {
    console.log('gameType =', res)
    return res
  }),
  D.compose(D.literal(...e.values, 'CUSTOM', 'TUTORIAL', 'MATCHED')),
  D.map((m): GameType => {
    if (m === 'CUSTOM') return 'CUSTOM_GAME'
    if (m === 'TUTORIAL') return 'TUTORIAL_GAME'
    if (m === 'MATCHED') return 'MATCHED_GAME'

    return m
  }),
)

const GameType = {
  decoder,
  codec: C.make(decoder, e.encoder),
}

export { GameType }
