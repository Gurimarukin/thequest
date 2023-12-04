import { eq, string } from 'fp-ts'
import type { Endomorphism } from 'fp-ts/Endomorphism'
import { identity, pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'
import { type Newtype, iso } from 'newtype-ts'

import { immutableAssign } from '../../utils/fp'
import { fromNewtype } from '../../utils/ioTsUtils'

type SummonerName = Newtype<{ readonly SummonerName: unique symbol }, string>

const { wrap, unwrap } = iso<SummonerName>()
const modify = identity as (f: Endomorphism<string>) => Endomorphism<SummonerName>

const codec = fromNewtype<SummonerName>(C.string)

const whiteSpaces = /\s+/g
const clean = modify(name => name.toLowerCase().replaceAll(whiteSpaces, ''))

const Eq: eq.Eq<SummonerName> = pipe(string.Eq, eq.contramap(unwrap))

const SummonerName = immutableAssign(wrap, { unwrap, codec, clean, Eq })

export { SummonerName }
