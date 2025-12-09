import type { Ability } from '../../../shared/models/api/Ability'

import type { ChampionEnglishName } from './ChampionEnglishName'

export type WikiMapChanges = ReadonlyMap<ChampionEnglishName, WikiMapChangeAbilities>

export type WikiMapChangeAbilities = ReadonlyMap<Ability, string>
