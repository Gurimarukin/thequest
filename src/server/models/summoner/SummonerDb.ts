import * as C from 'io-ts/Codec'
import * as E from 'io-ts/Encoder'

import { Platform } from '../../../shared/models/api/Platform'
import { Puuid } from '../../../shared/models/api/summoner/Puuid'
import { SummonerName } from '../../../shared/models/riot/SummonerName'
import { Maybe } from '../../../shared/utils/fp'

import { DayJsFromDate } from '../../utils/ioTsUtils'

type SummonerDb = C.TypeOf<typeof codec>

const codec = C.struct({
  puuid: Puuid.codec,
  platform: Platform.codec,
  /**
   * Exists as Maybe for retrocompatibility
   */
  name: Maybe.codec(SummonerName.codec),
  profileIconId: C.number,
  summonerLevel: C.number,
  insertedAt: DayJsFromDate.codec,
})

const SummonerDb = { codec }

type SummonerDbPuuidOnly = C.TypeOf<typeof summonerDbPuuidOnlyEncoder>

const summonerDbPuuidOnlyEncoder = E.struct({
  puuid: Puuid.codec,
})

const SummonerDbPuuidOnly = { encoder: summonerDbPuuidOnlyEncoder }

export { SummonerDb, SummonerDbPuuidOnly }
