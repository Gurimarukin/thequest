import { number, ord, string } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import type { Ord } from 'fp-ts/Ord'

import type { ChampionLevelOrZero } from '../../../shared/models/api/ChampionLevel'
import type { ChampionMasteryView } from '../../../shared/models/api/ChampionMasteryView'

type EnrichedChampionMastery = Omit<ChampionMasteryView, 'championLevel'> & {
  readonly championLevel: ChampionLevelOrZero
  readonly name: string
  readonly percents: number
  readonly isGlowing: boolean
}

const byPercents: Ord<EnrichedChampionMastery> = pipe(
  number.Ord,
  ord.contramap(c => c.percents),
)

const byPoints: Ord<EnrichedChampionMastery> = pipe(
  number.Ord,
  ord.contramap(c => c.championPoints),
)

const byName: Ord<EnrichedChampionMastery> = pipe(
  string.Ord,
  ord.contramap(c => c.name),
)

const EnrichedChampionMastery = { Ord: { byPercents, byPoints, byName } }

export { EnrichedChampionMastery }
