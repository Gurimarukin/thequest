import * as C from 'io-ts/Codec'

import { Puuid } from './Puuid'

type SummonerView = C.TypeOf<typeof codec>

const codec = C.struct({
  puuid: Puuid.codec,
  name: C.string,
  profileIconId: C.number,
  summonerLevel: C.number,
})

const SummonerView = { codec }

export { SummonerView }
