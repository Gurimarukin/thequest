import { eq, string } from 'fp-ts'
import type { Endomorphism } from 'fp-ts/Endomorphism'
import { identity, pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'
import { type Newtype, iso } from 'newtype-ts'

import { fromNewtype } from '../../utils/ioTsUtils'

type GameName = Newtype<{ readonly GameName: unique symbol }, string>

const { wrap, unwrap } = iso<GameName>()
const modify = identity as (f: Endomorphism<string>) => Endomorphism<GameName>

const codec = fromNewtype<GameName>(C.string)

const trim = modify(string.trim)

const whiteSpaces = /\s+/g
const clean = modify(name => name.toLowerCase().replaceAll(whiteSpaces, ''))

const Eq: eq.Eq<GameName> = pipe(string.Eq, eq.contramap(unwrap))

const GameName = { wrap, unwrap, codec, trim, clean, Eq }

export { GameName }
