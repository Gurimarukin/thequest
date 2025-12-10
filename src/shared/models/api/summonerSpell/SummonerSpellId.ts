import * as C from 'io-ts/Codec'
import type { Newtype } from 'newtype-ts'

import { fromNewtype } from '../../../utils/ioTsUtils'

/** Summoner spell's name, but without special chars */
type SummonerSpellId = Newtype<{ readonly SummonerSpellId: unique symbol }, string>

const codec = fromNewtype<SummonerSpellId>(C.string)

const SummonerSpellId = { codec }

export { SummonerSpellId }
