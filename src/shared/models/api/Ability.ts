import { eq, string } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'
import type { Newtype } from 'newtype-ts'
import { iso } from 'newtype-ts'

import { immutableAssign } from '../../utils/fp'
import { fromNewtype } from '../../utils/ioTsUtils'

/**
 * Different from [`Skill`](./Skill.ts).
 *
 * An ability is linked to a skill, but a skill can have one or more abilities.
 */
type Ability = Newtype<{ readonly Ability: unique symbol }, string>

const { wrap, unwrap } = iso<Ability>()

const codec = fromNewtype<Ability>(C.string)

const Eq: eq.Eq<Ability> = pipe(string.Eq, eq.contramap(unwrap))

const Ability = immutableAssign(wrap, { unwrap, codec, Eq })

export { Ability }
