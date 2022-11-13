import * as C from 'io-ts/Codec'
import * as D from 'io-ts/Decoder'
import * as E from 'io-ts/Encoder'

type SummonerView = C.TypeOf<typeof codec>

const codec = C.struct({
  summoner: C.struct({
    name: C.string,
    profileIconId: C.number,
    summonerLevel: C.number,
  }),
  masteries: C.make(D.id<unknown>(), E.id<unknown>()),
})

const SummonerView = { codec }

export { SummonerView }
