import { number, ord, string } from 'fp-ts'
import type { Ord } from 'fp-ts/Ord'
import { pipe } from 'fp-ts/function'
import { lens } from 'monocle-ts'

import type { AramData } from '../../../shared/models/api/AramData'
import type { ChampionMasteryView } from '../../../shared/models/api/ChampionMasteryView'
import type {
  ChampionFaction,
  ChampionFactionOrNone,
} from '../../../shared/models/api/champion/ChampionFaction'
import type { ChampionPosition } from '../../../shared/models/api/champion/ChampionPosition'
import { StringUtils } from '../../../shared/utils/StringUtils'
import type { List } from '../../../shared/utils/fp'
import { Maybe } from '../../../shared/utils/fp'

import type { ChampionAramCategory } from '../../models/ChampionAramCategory'

type EnrichedChampionMastery = ChampionMasteryView & {
  name: string
  percents: number
  shardsCount: Maybe<number>
  glow: boolean
  positions: List<ChampionPosition>
  factions: List<ChampionFaction>
  aram: AramData
  category: ChampionAramCategory
  faction: ChampionFactionOrNone
  isHidden: boolean
}

const byPercents: Ord<EnrichedChampionMastery> = pipe(
  number.Ord,
  ord.contramap((c: EnrichedChampionMastery) => c.percents),
)

const byPoints: Ord<EnrichedChampionMastery> = pipe(
  number.Ord,
  ord.contramap((c: EnrichedChampionMastery) => c.championPoints),
)

const byShards: Ord<EnrichedChampionMastery> = pipe(
  number.Ord,
  ord.contramap((c: EnrichedChampionMastery) =>
    pipe(
      c.shardsCount,
      Maybe.getOrElse(() => 0),
    ),
  ),
)

const byName: Ord<EnrichedChampionMastery> = pipe(
  string.Ord,
  ord.contramap((c: EnrichedChampionMastery) => StringUtils.cleanUTF8ToASCII(c.name)),
)

const EnrichedChampionMastery = {
  Ord: { byPercents, byPoints, byShards, byName },
  Lens: {
    shardsCount: pipe(lens.id<EnrichedChampionMastery>(), lens.prop('shardsCount'), lens.some),
    glow: pipe(lens.id<EnrichedChampionMastery>(), lens.prop('glow')),
    faction: pipe(lens.id<EnrichedChampionMastery>(), lens.prop('faction')),
    isHidden: pipe(lens.id<EnrichedChampionMastery>(), lens.prop('isHidden')),
  },
}

export { EnrichedChampionMastery }
