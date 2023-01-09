import * as C from 'io-ts/Codec'

type SummonerView = C.TypeOf<typeof codec>

const codec = C.struct({
  name: C.string,
  profileIconId: C.number,
  summonerLevel: C.number,
})

const SummonerView = { codec }

export { SummonerView }
