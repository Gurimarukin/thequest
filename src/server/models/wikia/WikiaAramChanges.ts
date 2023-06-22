import type { ChampionSpellHtml } from '../../../shared/models/api/AramData'
import type { SpellName } from '../../../shared/models/api/SpellName'
import type { Dict, PartialDict } from '../../../shared/utils/fp'

export type WikiaAramChanges = Dict<string, PartialDict<SpellName, ChampionSpellHtml>>
