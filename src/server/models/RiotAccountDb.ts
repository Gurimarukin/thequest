import * as C from 'io-ts/Codec'

import { Platform } from '../../shared/models/api/Platform'

import { DayJsFromDate } from '../utils/ioTsUtils'
import { Puuid } from './riot/Puuid'
import { TagLine } from './riot/TagLine'

type RiotAccountDb = Readonly<C.TypeOf<typeof codec>>

const codec = C.struct({
  gameName: C.string,
  tagLine: TagLine.codec,
  platform: Platform.codec,
  puuid: Puuid.codec,
  insertedAt: DayJsFromDate.codec,
})

const RiotAccountDb = { codec }

export { RiotAccountDb }
