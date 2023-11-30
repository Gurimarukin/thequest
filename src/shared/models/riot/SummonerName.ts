import { eq, string } from 'fp-ts'
import type { Endomorphism } from 'fp-ts/Endomorphism'
import { identity, pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'
import { type Newtype, iso } from 'newtype-ts'

import { fromNewtype } from '../../utils/ioTsUtils'
import { GameName } from './GameName'

type SummonerName = Newtype<{ readonly SummonerName: unique symbol }, string>

const { wrap, unwrap } = iso<SummonerName>()
const modify = identity as (f: Endomorphism<string>) => Endomorphism<SummonerName>

const codec = fromNewtype<SummonerName>(C.string)

/**
 * @deprecated SummonerName will be removed
 */
function fromGameName(name: GameName): SummonerName {
  return wrap(GameName.unwrap(name))
}

const whiteSpaces = /\s+/g
const clean = modify(name => name.toLowerCase().replaceAll(whiteSpaces, ''))

const Eq: eq.Eq<SummonerName> = pipe(string.Eq, eq.contramap(unwrap))

const SummonerName = { wrap, unwrap, codec, fromGameName, clean, Eq }

export { SummonerName }
