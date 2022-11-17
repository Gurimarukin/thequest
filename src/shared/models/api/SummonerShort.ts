import { eq, ord, string } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'

import { Platform } from './Platform'

type SummonerShort = C.TypeOf<typeof codec>

const codec = C.struct({
  platform: Platform.codec,
  name: C.string,
  profileIconId: C.number,
})

const byPlatformAndNameEq: eq.Eq<SummonerShort> = eq.struct<
  Pick<SummonerShort, 'platform' | 'name'>
>({
  platform: Platform.Eq,
  name: string.Eq,
})

const byNameOrd: ord.Ord<SummonerShort> = pipe(
  string.Ord,
  ord.contramap(s => s.name),
)

const SummonerShort = { codec, byPlatformAndNameEq, byNameOrd }

export { SummonerShort }
