import type { ChampionSpellHtml } from '../../../shared/models/api/MapChangesData'
import type { SpellName } from '../../../shared/models/api/SpellName'
import type { PartialDict } from '../../../shared/utils/fp'

import type { ChampionEnglishName } from './ChampionEnglishName'

export type WikiMapChanges = ReadonlyMap<
  ChampionEnglishName,
  PartialDict<SpellName, ChampionSpellHtml>
>
