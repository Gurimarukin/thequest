import * as D from 'io-ts/Decoder'

import { Puuid } from '../../../shared/models/api/summoner/Puuid'

type RiotAccount = D.TypeOf<typeof decoder>

const decoder = D.struct({
  puuid: Puuid.codec,
  gameName: D.string,
  tagLine: D.string,
})

const RiotAccount = { decoder }

export { RiotAccount }
