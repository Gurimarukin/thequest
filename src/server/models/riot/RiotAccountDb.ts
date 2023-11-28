import * as C from 'io-ts/Codec'

import { Platform } from '../../../shared/models/api/Platform'
import { Puuid } from '../../../shared/models/api/summoner/Puuid'
import { GameName } from '../../../shared/models/riot/GameName'
import { TagLine } from '../../../shared/models/riot/TagLine'

import { DayJsFromDate } from '../../utils/ioTsUtils'

type RiotAccountDb = C.TypeOf<typeof codec>

const codec = C.struct({
  gameName: GameName.codec,
  tagLine: TagLine.codec,
  platform: Platform.codec,
  puuid: Puuid.codec,
  insertedAt: DayJsFromDate.codec,
})

const RiotAccountDb = { codec }

export { RiotAccountDb }
