import type { NonEmptyArray } from '../../../shared/utils/fp'

import type { WikiChampionFaction } from '../wikia/WikiChampionFaction'
import type { ChampionEnglishName } from './ChampionEnglishName'

export type WikiChallenge = {
  faction: WikiChampionFaction
  title: string
  champions: NonEmptyArray<ChampionEnglishName>
}
