import * as C from 'io-ts/Codec'

import { SummonerName } from '../../riot/SummonerName'
import { Puuid } from './Puuid'

type SummonerView = C.TypeOf<typeof codec>

const codec = C.struct({
  puuid: Puuid.codec,
  name: SummonerName.codec,
  profileIconId: C.number,
  summonerLevel: C.number,
})

const SummonerView = { codec }

export { SummonerView }
