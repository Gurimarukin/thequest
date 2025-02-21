import { number, ord, string } from 'fp-ts'
import type { Ord } from 'fp-ts/Ord'
import { pipe } from 'fp-ts/function'
import { lens } from 'monocle-ts'

import type { ChampionMasteryView } from '../../../shared/models/api/ChampionMasteryView'
import type { MapChangesData } from '../../../shared/models/api/MapChangesData'
import type {
  ChampionFaction,
  ChampionFactionOrNone,
} from '../../../shared/models/api/champion/ChampionFaction'
import type { ChampionPosition } from '../../../shared/models/api/champion/ChampionPosition'
import { StringUtils } from '../../../shared/utils/StringUtils'
import type { List, Maybe } from '../../../shared/utils/fp'

import type { ChampionAramCategory } from '../../models/ChampionAramCategory'

type EnrichedChampionMastery = ChampionMasteryView & {
  name: string
  percents: number
  shardsCount: Maybe<number>
  glow: boolean
  positions: List<ChampionPosition>
  factions: List<ChampionFaction>
  aram: MapChangesData
  category: ChampionAramCategory
  faction: ChampionFactionOrNone
  isHidden: boolean
}

const byLevel: Ord<EnrichedChampionMastery> = pipe(
  number.Ord,
  ord.contramap((c: EnrichedChampionMastery) => c.championLevel),
)

const byTokens: Ord<EnrichedChampionMastery> = pipe(
  number.Ord,
  ord.contramap((c: EnrichedChampionMastery) => c.tokensEarned),
)

const byPercents: Ord<EnrichedChampionMastery> = pipe(
  number.Ord,
  ord.contramap((c: EnrichedChampionMastery) => c.percents),
)

const byPoints: Ord<EnrichedChampionMastery> = pipe(
  number.Ord,
  ord.contramap((c: EnrichedChampionMastery) => c.championPoints),
)

const byName: Ord<EnrichedChampionMastery> = pipe(
  string.Ord,
  ord.contramap((c: EnrichedChampionMastery) => StringUtils.cleanUTF8ToASCII(c.name)),
)

const EnrichedChampionMastery = {
  Ord: { byLevel, byTokens, byPercents, byPoints, byName },
  Lens: {
    shardsCount: pipe(lens.id<EnrichedChampionMastery>(), lens.prop('shardsCount'), lens.some),
    glow: pipe(lens.id<EnrichedChampionMastery>(), lens.prop('glow')),
    faction: pipe(lens.id<EnrichedChampionMastery>(), lens.prop('faction')),
    isHidden: pipe(lens.id<EnrichedChampionMastery>(), lens.prop('isHidden')),
  },
}

export { EnrichedChampionMastery }
