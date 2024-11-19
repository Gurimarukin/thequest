import type { eq } from 'fp-ts'
import { ord, string } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'
import type { Newtype } from 'newtype-ts'
import { iso } from 'newtype-ts'

import { immutableAssign } from '../../../shared/utils/fp'
import { fromNewtype } from '../../../shared/utils/ioTsUtils'

// Champion's english name. Acts as an id for the wiki.

type ChampionEnglishName = Newtype<{ readonly ChampionEnglishName: unique symbol }, string>

const { wrap, unwrap } = iso<ChampionEnglishName>()

const codec = fromNewtype<ChampionEnglishName>(C.string)

const Ord: ord.Ord<ChampionEnglishName> = pipe(string.Ord, ord.contramap(unwrap))
const Eq: eq.Eq<ChampionEnglishName> = Ord

const ChampionEnglishName = immutableAssign(wrap, { unwrap, codec, Eq, Ord })

export { ChampionEnglishName }
