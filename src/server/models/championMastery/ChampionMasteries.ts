import type { DayJs } from '../../../shared/models/DayJs'
import type { MsDuration } from '../../../shared/models/MsDuration'
import type { List } from '../../../shared/utils/fp'

import type { ChampionMastery } from './ChampionMastery'

export type ChampionMasteries = {
  champions: List<ChampionMastery>
  insertedAt: DayJs
  cacheDuration: MsDuration
}
