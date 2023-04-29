import * as C from 'io-ts/Codec'

import { Platform } from '../../shared/models/api/Platform'
import { Puuid } from '../../shared/models/api/summoner/Puuid'

import { DayJsFromDate } from '../utils/ioTsUtils'
import { TagLine } from './riot/TagLine'

type RiotAccountDb = C.TypeOf<typeof codec>

const codec = C.struct({
  gameName: C.string,
  tagLine: TagLine.codec,
  platform: Platform.codec,
  puuid: Puuid.codec,
  insertedAt: DayJsFromDate.codec,
})

const RiotAccountDb = { codec }

export { RiotAccountDb }
