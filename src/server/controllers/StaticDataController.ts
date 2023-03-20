import { pipe } from 'fp-ts/function'

import type { Lang } from '../../shared/models/api/Lang'
import { StaticData } from '../../shared/models/api/StaticData'
import { Dict, Future, List, Tuple } from '../../shared/utils/fp'

import type { DDragonService } from '../services/DDragonService'
import type { EndedMiddleware } from '../webServer/models/MyMiddleware'
import { MyMiddleware as M } from '../webServer/models/MyMiddleware'

type StaticDataController = Readonly<ReturnType<typeof StaticDataController>>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const StaticDataController = (ddragonService: DDragonService) => ({
  staticData: (lang: Lang): EndedMiddleware =>
    pipe(
      ddragonService.latestDataChampions(lang),
      Future.map(
        ({ version, champions }): StaticData => ({
          version,
          champions: pipe(champions.data, Dict.toReadonlyArray, List.map(Tuple.snd)),
        }),
      ),
      M.fromTaskEither,
      M.ichain(M.json(StaticData.codec)),
    ),
})

export { StaticDataController }
