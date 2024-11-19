import type { NonEmptyArray } from '../../../shared/utils/fp'

import type { ChampionEnglishName } from '../wiki/ChampionEnglishName'
import type { WikiaChampionFaction } from './WikiaChampionFaction'

export type WikiaChallenge = {
  position: WikiaChampionFaction
  title: string
  champions: NonEmptyArray<ChampionEnglishName>
}
