import * as C from 'io-ts/Codec'

import { Puuid } from '../../../shared/models/api/summoner/Puuid'
import { RiotId } from '../../../shared/models/riot/RiotId'

import { DayJsFromDate } from '../../utils/ioTsUtils'

type RiotAccountDb = C.TypeOf<typeof codec>

const codec = C.struct({
  puuid: Puuid.codec,
  riotId: RiotId.fromStringCodec,
  insertedAt: DayJsFromDate.codec,
})

const RiotAccountDb = { codec }

export { RiotAccountDb }
