import * as C from 'io-ts/Codec'

import { SummonerId } from './SummonerId'

type SummonerView = Readonly<C.TypeOf<typeof codec>>

const codec = C.struct({
  id: SummonerId.codec,
  name: C.string,
  profileIconId: C.number,
  summonerLevel: C.number,
})

const SummonerView = { codec }

export { SummonerView }
