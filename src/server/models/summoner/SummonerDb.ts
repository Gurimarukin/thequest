import * as C from 'io-ts/Codec'

import { Platform } from '../../../shared/models/api/Platform'
import { SummonerId } from '../../../shared/models/api/summoner/SummonerId'

import { DayJsFromDate } from '../../utils/ioTsUtils'
import { Puuid } from '../riot/Puuid'

type SummonerDb = Readonly<C.TypeOf<typeof codec>>

const codec = C.struct({
  platform: Platform.codec,
  id: SummonerId.codec,
  puuid: Puuid.codec,
  name: C.string,
  profileIconId: C.number,
  summonerLevel: C.number,
  insertedAt: DayJsFromDate.codec,
})

const SummonerDb = { codec }

export { SummonerDb }
