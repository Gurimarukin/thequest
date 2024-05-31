import { eq, number } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import type { Codec } from 'io-ts/Codec'
import * as C from 'io-ts/Codec'
import * as D from 'io-ts/Decoder'
import type { Newtype } from 'newtype-ts'
import { iso } from 'newtype-ts'

import { immutableAssign } from '../../../utils/fp'
import { NumberFromString, fromNewtype } from '../../../utils/ioTsUtils'

// Champion's number id

type ChampionKey = Newtype<{ readonly ChampionKey: unique symbol }, number>

const { wrap, unwrap } = iso<ChampionKey>()

const codec = fromNewtype<ChampionKey>(C.number)

const fromStringCodec: Codec<unknown, string, ChampionKey> = C.make(
  pipe(NumberFromString.decoder, D.map(wrap)),
  { encode: String },
)

const Eq: eq.Eq<ChampionKey> = pipe(number.Eq, eq.contramap(unwrap))

const ChampionKey = immutableAssign(wrap, { unwrap, codec, fromStringCodec, Eq })

export { ChampionKey }
