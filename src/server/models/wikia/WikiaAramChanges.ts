import type { ChampionSpellHtml } from '../../../shared/models/api/AramData'
import type { SpellName } from '../../../shared/models/api/SpellName'
import type { PartialDict } from '../../../shared/utils/fp'

import type { ChampionEnglishName } from './ChampionEnglishName'

export type WikiaAramChanges = ReadonlyMap<
  ChampionEnglishName,
  PartialDict<SpellName, ChampionSpellHtml>
>
