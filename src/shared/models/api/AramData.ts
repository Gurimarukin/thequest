import { pipe } from 'fp-ts/function'
import type { Codec } from 'io-ts/Codec'
import * as C from 'io-ts/Codec'

import { Dict, List, Maybe } from '../../utils/fp'
import { WikiaStatsBalance } from '../wikia/WikiaStatsBalance'
import { Spell } from './Spell'

const spellsProperties: Dict<Spell, Codec<unknown, string, string>> = pipe(
  Spell.values,
  List.reduce(Dict.empty<Spell, Codec<unknown, string, string>>(), (acc, spell) => ({
    ...acc,
    [spell]: C.string,
  })),
)

type AramData = C.TypeOf<typeof codec>

const codec = C.struct({
  stats: Maybe.codec(WikiaStatsBalance.codec),
  spells: Maybe.codec(C.struct(spellsProperties)),
})

const AramData = { codec }

export { AramData }
