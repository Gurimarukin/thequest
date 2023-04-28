import { eq, ord, string } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'

import { Platform } from '../Platform'
import { Puuid } from './Puuid'

type SummonerShort = C.TypeOf<typeof codec>

const codec = C.struct({
  platform: Platform.codec,
  puuid: Puuid.codec,
  name: C.string,
  profileIconId: C.number,
})

const byPuuidEq: eq.Eq<SummonerShort> = eq.struct<Pick<SummonerShort, 'puuid'>>({
  puuid: Puuid.Eq,
})

const byNameOrd: ord.Ord<SummonerShort> = pipe(
  string.Ord,
  ord.contramap(s => s.name),
)

const SummonerShort = { codec, byPuuidEq, byNameOrd }

export { SummonerShort }
