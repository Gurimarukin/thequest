import { eq, ord, string } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'

import { Platform } from './Platform'
import { SummonerId } from './SummonerId'

type SummonerShort = C.TypeOf<typeof codec>

const codec = C.struct({
  id: SummonerId.codec,
  platform: Platform.codec,
  name: C.string,
  profileIconId: C.number,
})

const byIdEq: eq.Eq<SummonerShort> = eq.struct<Pick<SummonerShort, 'id'>>({
  id: SummonerId.Eq,
})

const byNameOrd: ord.Ord<SummonerShort> = pipe(
  string.Ord,
  ord.contramap(s => s.name),
)

const SummonerShort = { codec, byIdEq, byNameOrd }

export { SummonerShort }
