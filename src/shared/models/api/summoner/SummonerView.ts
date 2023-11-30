import * as C from 'io-ts/Codec'

import { RiotId } from '../../riot/RiotId'
import { SummonerName } from '../../riot/SummonerName'
import { Puuid } from './Puuid'

type SummonerView = C.TypeOf<typeof codec>

const codec = C.struct({
  puuid: Puuid.codec,
  riotId: RiotId.fromStringCodec,
  name: SummonerName.codec,
  profileIconId: C.number,
  summonerLevel: C.number,
})

const SummonerView = { codec }

export { SummonerView }
