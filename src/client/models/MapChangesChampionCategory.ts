import { monoid, number } from 'fp-ts'
import { pipe } from 'fp-ts/function'

import { WikiStatsBalance } from '../../shared/models/WikiStatsBalance'
import type { MapChangesData } from '../../shared/models/api/MapChangesData'
import { DictUtils } from '../../shared/utils/DictUtils'
import { createEnum } from '../../shared/utils/createEnum'
import { List, Maybe } from '../../shared/utils/fp'

type MapChangesChampionCategory = typeof e.T

const e = createEnum('buffed', 'nerfed', 'other', 'balanced')

const fromData = (data: MapChangesData): MapChangesChampionCategory =>
  pipe(
    data.stats,
    Maybe.map((stats): MapChangesChampionCategory => {
      const normalized = normalizeStats(stats)
      return normalized < 0 ? 'nerfed' : 0 < normalized ? 'buffed' : 'other'
    }),
    Maybe.getOrElse(() =>
      pipe(
        data.skills,
        Maybe.fold<unknown, MapChangesChampionCategory>(
          () => 'balanced',
          () => 'other',
        ),
      ),
    ),
  )

const normalizeStats = (stats: WikiStatsBalance): number =>
  pipe(
    stats,
    DictUtils.partial.entries,
    List.map(([key, val]): number => {
      if (val === undefined || val === 0) return 0

      return (
        ((WikiStatsBalance.isModifierStat(key) ? val - 1 : val) < 0 ? -1 : 1) *
        (WikiStatsBalance.isMalusStat(key) ? -1 : 1)
      )
    }),
    monoid.concatAll(number.MonoidSum),
  )

const MapChangesChampionCategory = { values: e.values, fromData, Eq: e.Eq }

export { MapChangesChampionCategory }
