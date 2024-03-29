import * as D from 'io-ts/Decoder'

import { Puuid } from '../../../shared/models/api/summoner/Puuid'
import { GameName } from '../../../shared/models/riot/GameName'
import { TagLine } from '../../../shared/models/riot/TagLine'

type RiotRiotAccount = D.TypeOf<typeof decoder>

const decoder = D.struct({
  puuid: Puuid.codec,
  gameName: GameName.codec,
  tagLine: TagLine.codec,
})

const RiotRiotAccount = { decoder }

export { RiotRiotAccount }
