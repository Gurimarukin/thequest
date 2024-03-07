import * as D from 'io-ts/Decoder'

import { RiotCurrentLolGameInfo } from './RiotCurrentLolGameInfo'

type RiotCurrentGameInfo = D.TypeOf<typeof decoder>

const decoder = D.union(D.struct({ gameMode: D.literal('TFT') }), RiotCurrentLolGameInfo.decoder)

const RiotCurrentGameInfo = { decoder }

export { RiotCurrentGameInfo }
