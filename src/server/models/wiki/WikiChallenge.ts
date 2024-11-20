import type { NonEmptyArray } from '../../../shared/utils/fp'

import type { ChampionEnglishName } from './ChampionEnglishName'
import type { WikiChampionFaction } from './WikiChampionFaction'

export type WikiChallenge = {
  faction: WikiChampionFaction
  title: string
  champions: NonEmptyArray<ChampionEnglishName>
}
