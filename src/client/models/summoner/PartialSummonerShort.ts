import * as C from 'io-ts/Codec'

import { SummonerShort } from '../../../shared/models/api/summoner/SummonerShort'
import { RiotId } from '../../../shared/models/riot/RiotId'
import { Maybe } from '../../../shared/utils/fp'

export type PartialSummonerShort = C.TypeOf<typeof codec>

const codec = C.struct({
  ...SummonerShort.codecProperties,
  riotId: Maybe.codec(RiotId.fromStringCodec),
})

// eslint-disable-next-line deprecation/deprecation
function fromSummonerShort(summoner: SummonerShort): PartialSummonerShort {
  return { ...summoner, riotId: Maybe.some(summoner.riotId) }
}

/**
 * @deprecated remove SummonerName
 */
export const PartialSummonerShort = { codec, fromSummonerShort }
