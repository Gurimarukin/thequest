import { number, ord, string } from 'fp-ts'
import type { Ord } from 'fp-ts/Ord'
import { pipe } from 'fp-ts/function'

import type { ChampionLevelOrZero } from '../../../shared/models/api/ChampionLevel'
import type { ChampionMasteryView } from '../../../shared/models/api/ChampionMasteryView'
import { StringUtils } from '../../../shared/utils/StringUtils'
import { Maybe } from '../../../shared/utils/fp'

type EnrichedChampionMastery = Omit<ChampionMasteryView, 'championLevel'> & {
  readonly championLevel: ChampionLevelOrZero
  readonly name: string
  readonly percents: number
  readonly shardsCount: Maybe<number>
  readonly glow: Maybe<number> // animation delay (in seconds) if is glowing
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

const EnrichedChampionMastery = { Ord: { byPercents, byPoints, byShards, byName } }

export { EnrichedChampionMastery }
