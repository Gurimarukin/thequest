import { eq, ord, string } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'

import { StringUtils } from '../../../utils/StringUtils'
import { SummonerName } from '../../riot/SummonerName'
import { Platform } from '../Platform'
import { Puuid } from './Puuid'

type SummonerShort = C.TypeOf<typeof codec>

const codec = C.struct({
  platform: Platform.codec,
  puuid: Puuid.codec,
  name: SummonerName.codec,
  profileIconId: C.number,
})

const byPuuidEq: eq.Eq<SummonerShort> = eq.struct<Pick<SummonerShort, 'puuid'>>({
  puuid: Puuid.Eq,
})

const byNameOrd: ord.Ord<SummonerShort> = pipe(
  string.Ord,
  ord.contramap((s: SummonerShort) =>
    StringUtils.cleanUTF8ToASCII(SummonerName.unwrap(s.name)).toLowerCase(),
  ),
)

const SummonerShort = { codec, byPuuidEq, byNameOrd }

export { SummonerShort }
