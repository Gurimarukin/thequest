import { eq, number } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import type { Codec } from 'io-ts/Codec'
import * as C from 'io-ts/Codec'
import * as D from 'io-ts/Decoder'
import type { Newtype } from 'newtype-ts'
import { iso } from 'newtype-ts'

import { NumberFromString, fromNewtype } from '../../../utils/ioTsUtils'

// Summoner spell's number id

type SummonerSpellKey = Newtype<{ readonly SummonerSpellKey: unique symbol }, number>

const { wrap, unwrap } = iso<SummonerSpellKey>()

const codec = fromNewtype<SummonerSpellKey>(C.number)

const fromStringCodec: Codec<unknown, string, SummonerSpellKey> = C.make(
  pipe(NumberFromString.decoder, D.map(wrap)),
  { encode: String },
)

const Eq: eq.Eq<SummonerSpellKey> = pipe(number.Eq, eq.contramap(unwrap))

const SummonerSpellKey = { unwrap, codec, fromStringCodec, Eq }

export { SummonerSpellKey }
