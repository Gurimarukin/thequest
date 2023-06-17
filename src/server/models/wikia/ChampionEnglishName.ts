import { ord, string } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'
import type { Newtype } from 'newtype-ts'
import { iso } from 'newtype-ts'

import { fromNewtype } from '../../../shared/utils/ioTsUtils'

// Champion's english name. Acts as an id for the wikia.

type ChampionEnglishName = Newtype<{ readonly ChampionEnglishName: unique symbol }, string>

const { wrap, unwrap } = iso<ChampionEnglishName>()

const codec = fromNewtype<ChampionEnglishName>(C.string)

const Ord: ord.Ord<ChampionEnglishName> = pipe(string.Ord, ord.contramap(unwrap))

const ChampionEnglishName = { wrap, codec, Ord }

export { ChampionEnglishName }
