import { eq, string } from 'fp-ts'
import type { Endomorphism } from 'fp-ts/Endomorphism'
import { identity, pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'
import { type Newtype, iso } from 'newtype-ts'

import { immutableAssign } from '../../utils/fp'
import { fromNewtype } from '../../utils/ioTsUtils'

type TagLine = Newtype<{ readonly TagLine: unique symbol }, string>

const { wrap, unwrap } = iso<TagLine>()
const modify = identity as (f: Endomorphism<string>) => Endomorphism<TagLine>

const codec = fromNewtype<TagLine>(C.string)

const trim = modify(string.trim)

const whiteSpaces = /\s+/g
const clean = modify(name => name.toLowerCase().replaceAll(whiteSpaces, ''))

const Eq: eq.Eq<TagLine> = pipe(string.Eq, eq.contramap(unwrap))

const TagLine = immutableAssign(wrap, { unwrap, codec, trim, clean, Eq })

export { TagLine }
