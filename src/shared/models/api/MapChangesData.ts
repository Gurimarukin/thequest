import { pipe } from 'fp-ts/function'
import type { Codec } from 'io-ts/Codec'
import * as C from 'io-ts/Codec'

import { Dict, List, Maybe } from '../../utils/fp'
import { WikiStatsBalance } from '../WikiStatsBalance'
import { SpellName } from './SpellName'

type ChampionSpellHtml = C.TypeOf<typeof championSpellHtmlCodec>
type ChampionSpellHtmlOutput = C.OutputOf<typeof championSpellHtmlCodec>

const championSpellHtmlCodec = C.struct({
  image: C.string,
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

type MapChangesData = C.TypeOf<typeof codec>

const codec = C.struct({
  stats: Maybe.codec(WikiStatsBalance.codec),
  spells: Maybe.codec(C.partial(spellsProperties)),
})

const empty: MapChangesData = {
  stats: Maybe.none,
  spells: Maybe.none,
}

const MapChangesData = { codec, empty }

export { ChampionSpellHtml, MapChangesData }
