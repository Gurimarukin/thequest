import { monoid, number } from 'fp-ts'
import { pipe } from 'fp-ts/function'

import type { AramData } from '../../shared/models/api/AramData'
import { WikiaStatsBalance } from '../../shared/models/wikia/WikiaStatsBalance'
import { DictUtils } from '../../shared/utils/DictUtils'
import { createEnum } from '../../shared/utils/createEnum'
import { List, Maybe } from '../../shared/utils/fp'

type ChampionCategory = typeof e.T

const e = createEnum('buffed', 'nerfed', 'other', 'balanced')

const fromAramData = (aram: AramData): ChampionCategory =>
  pipe(
    aram.stats,
    Maybe.map((stats): ChampionCategory => {
      const normalized = normalizeStats(stats)
      return normalized < 0 ? 'nerfed' : 0 < normalized ? 'buffed' : 'other'
    }),
    Maybe.getOrElse(() =>
      pipe(
        aram.spells,
        Maybe.fold<unknown, ChampionCategory>(
          () => 'balanced',
          () => 'other',
        ),
      ),
    ),
  )

const normalizeStats = (stats: WikiaStatsBalance): number =>
  pipe(
    stats,
    DictUtils.partial.entries,
    List.map(([key, val]): number => {
      if (val === undefined || val === 0) return 0

      return (
        ((WikiaStatsBalance.isModifierStat(key) ? val - 1 : val) < 0 ? -1 : 1) *
        (WikiaStatsBalance.isMalusStat(key) ? -1 : 1)
      )
    }),
    monoid.concatAll(number.MonoidSum),
  )

const ChampionCategory = { values: e.values, fromAramData, Eq: e.Eq }

export { ChampionCategory }
