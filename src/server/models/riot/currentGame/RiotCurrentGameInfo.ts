import { pipe } from 'fp-ts/function'
import type { Decoder } from 'io-ts/Decoder'
import * as D from 'io-ts/Decoder'

import { Either } from '../../../../shared/utils/fp'

import { RiotCurrentLolGameInfo } from './RiotCurrentLolGameInfo'

type TftGame = D.TypeOf<typeof tftDecoder>

const tftDecoder = D.struct({
  // don't decode TFT games further, switch to LoL game
  gameMode: D.literal('TFT'),
})

type RiotCurrentGameInfo = Either<TftGame, RiotCurrentLolGameInfo>

const decoder: Decoder<unknown, RiotCurrentGameInfo> = D.union(
  pipe(
    // don't decode TFT games further, switch to LoL game
    tftDecoder,
    D.map(Either.left),
  ),
  pipe(RiotCurrentLolGameInfo.decoder, D.map(Either.right)),
)

const RiotCurrentGameInfo = { decoder }

export { RiotCurrentGameInfo }
