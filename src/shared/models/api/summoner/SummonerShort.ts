import { ord, string } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'

import { StringUtils } from '../../../utils/StringUtils'
import { RiotId } from '../../riot/RiotId'
import { SummonerName } from '../../riot/SummonerName'
import { Platform } from '../Platform'
import { Puuid } from './Puuid'

type SummonerShort = C.TypeOf<typeof codec>

const codecProperties = {
  platform: Platform.codec,
  puuid: Puuid.codec,
  riotId: RiotId.fromStringCodec,
  name: SummonerName.codec,
  profileIconId: C.number,
}

const codec = C.struct(codecProperties)

const byRiotIdOrd: ord.Ord<SummonerShort> = pipe(
  string.Ord,
  ord.contramap((s: SummonerShort) =>
    StringUtils.cleanUTF8ToASCII(RiotId.stringify(s.riotId)).toLowerCase(),
  ),
)

const SummonerShort = { codecProperties, codec, byRiotIdOrd }

export { SummonerShort }
