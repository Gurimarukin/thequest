import { number, ord, string } from 'fp-ts'
import type { Ord } from 'fp-ts/Ord'
import { pipe } from 'fp-ts/function'
import { lens } from 'monocle-ts'

import type { AramData } from '../../../shared/models/api/AramData'
import type { ChampionMasteryView } from '../../../shared/models/api/ChampionMasteryView'
import type { ChampionLevelOrZero } from '../../../shared/models/api/champion/ChampionLevel'
import type { ChampionPosition } from '../../../shared/models/api/champion/ChampionPosition'
import { StringUtils } from '../../../shared/utils/StringUtils'
import type { List } from '../../../shared/utils/fp'
import { Maybe } from '../../../shared/utils/fp'

import type { ChampionCategory } from '../../models/ChampionCategory'

type EnrichedChampionMastery = Omit<ChampionMasteryView, 'championLevel'> & {
  championLevel: ChampionLevelOrZero
  name: string
  percents: number
  shardsCount: Maybe<number>
  glow: Maybe<number> // animation delay (in seconds) if is glowing
  positions: List<ChampionPosition>
  aram: AramData
  category: ChampionCategory
  isHidden: boolean
}

const byPercents: Ord<EnrichedChampionMastery> = pipe(
  number.Ord,
  ord.contramap(c => c.percents),
)

const byPoints: Ord<EnrichedChampionMastery> = pipe(
  number.Ord,
  ord.contramap(c => c.championPoints),
)

const byShards: Ord<EnrichedChampionMastery> = pipe(
  number.Ord,
  ord.contramap(c =>
    pipe(
      c.shardsCount,
      Maybe.getOrElse(() => 0),
    ),
  ),
)

const byName: Ord<EnrichedChampionMastery> = pipe(
  string.Ord,
  ord.contramap(c => StringUtils.cleanUTF8ToASCII(c.name)),
)

const Lens = {
  shardsCount: pipe(lens.id<EnrichedChampionMastery>(), lens.prop('shardsCount'), lens.some),
  glow: pipe(lens.id<EnrichedChampionMastery>(), lens.prop('glow')),
  isHidden: pipe(lens.id<EnrichedChampionMastery>(), lens.prop('isHidden')),
}

const EnrichedChampionMastery = {
  Ord: { byPercents, byPoints, byShards, byName },
  Lens,
}

export { EnrichedChampionMastery }
