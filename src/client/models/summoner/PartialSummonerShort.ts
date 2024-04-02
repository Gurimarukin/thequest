import * as C from 'io-ts/Codec'

import { SummonerShort } from '../../../shared/models/api/summoner/SummonerShort'
import { RiotId } from '../../../shared/models/riot/RiotId'
import { Maybe } from '../../../shared/utils/fp'

export type PartialSummonerShort = C.TypeOf<typeof codec>

const codec = C.struct({
  ...SummonerShort.codecProperties,
  riotId: Maybe.codec(RiotId.fromStringCodec),
})

function fromSummonerShort(summoner: SummonerShort): PartialSummonerShort {
  return { ...summoner, riotId: Maybe.some(summoner.riotId) }
}

export const PartialSummonerShort = { codec, fromSummonerShort }
