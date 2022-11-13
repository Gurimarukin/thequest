import { pipe } from 'fp-ts/function'
import { Status } from 'hyper-ts'

import type { Lang } from '../../shared/models/api/Lang'
import { StaticData } from '../../shared/models/api/StaticData'
import type { StaticDataChampion } from '../../shared/models/api/StaticDataChampion'
import { Dict, Future, List, NonEmptyArray } from '../../shared/utils/fp'

import type { RiotApiService } from '../services/RiotApiService'
import type { EndedMiddleware } from '../webServer/models/MyMiddleware'
import { MyMiddleware as M } from '../webServer/models/MyMiddleware'

type StaticDataController = ReturnType<typeof StaticDataController>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const StaticDataController = (riotApiService: RiotApiService) => ({
  staticData: (lang: Lang): EndedMiddleware =>
    pipe(
      riotApiService.lol.ddragon.apiVersions,
      Future.map(NonEmptyArray.head),
      Future.bindTo('version'),
      Future.bind('champions', ({ version }) =>
        riotApiService.lol.ddragon.dataChampions(version, lang),
      ),
      Future.map(
        ({ version, champions }): StaticData => ({
          version,
          champions: pipe(
            champions.data,
            Dict.toReadonlyArray,
            List.map(([, { id, key, name }]): StaticDataChampion => ({ id, key, name })),
          ),
        }),
      ),
      M.fromTaskEither,
      M.ichain(M.jsonWithStatus(Status.OK, StaticData.codec)),
    ),
})

export { StaticDataController }
