import * as C from 'io-ts/Codec'
import * as E from 'io-ts/Encoder'

import { Platform } from '../../../shared/models/api/Platform'

import { DayJsFromDate } from '../../utils/ioTsUtils'
import { Puuid } from '../riot/Puuid'
import { SummonerId } from './SummonerId'

type SummonerDb = Readonly<C.TypeOf<typeof codec>>

const codec = C.struct({
  id: SummonerId.codec,
  puuid: Puuid.codec,
  platform: Platform.codec,
  name: C.string,
  profileIconId: C.number,
  summonerLevel: C.number,
  insertedAt: DayJsFromDate.codec,
})

const SummonerDb = { codec }

type SummonerDbPuuidOnly = Readonly<C.TypeOf<typeof summonerDbPuuidOnlyEncoder>>

const summonerDbPuuidOnlyEncoder = E.struct({
  puuid: Puuid.codec,
})

const SummonerDbPuuidOnly = { encoder: summonerDbPuuidOnlyEncoder }

export { SummonerDb, SummonerDbPuuidOnly }
