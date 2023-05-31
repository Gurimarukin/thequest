import { pipe } from 'fp-ts/function'
import type { Codec } from 'io-ts/Codec'
import * as C from 'io-ts/Codec'

import { Dict, List, Maybe } from '../../utils/fp'
import { WikiaStatsBalance } from '../wikia/WikiaStatsBalance'
import { SpellName } from './SpellName'

type ChampionSpellHtml = C.TypeOf<typeof championSpellHtmlCodec>
type ChampionSpellHtmlOutput = C.OutputOf<typeof championSpellHtmlCodec>

const championSpellHtmlCodec = C.struct({
  spell: C.string,
  description: C.string,
})

const spellsProperties: Dict<
  SpellName,
  Codec<unknown, ChampionSpellHtmlOutput, ChampionSpellHtmlOutput>
> = pipe(
  SpellName.values,
  List.reduce(
    Dict.empty<SpellName, Codec<unknown, ChampionSpellHtmlOutput, ChampionSpellHtml>>(),
    (acc, spell) => ({ ...acc, [spell]: championSpellHtmlCodec }),
  ),
)

type AramData = C.TypeOf<typeof codec>

const codec = C.struct({
  stats: Maybe.codec(WikiaStatsBalance.codec),
  spells: Maybe.codec(C.partial(spellsProperties)),
})

const AramData = { codec }

export { AramData, ChampionSpellHtml }
