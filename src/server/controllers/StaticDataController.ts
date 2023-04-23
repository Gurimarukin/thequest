import { pipe } from 'fp-ts/function'

import type { Lang } from '../../shared/models/api/Lang'
import { StaticData } from '../../shared/models/api/StaticData'

import type { DDragonService } from '../services/DDragonService'
import type { StaticDataService } from '../services/staticDataService/StaticDataService'
import type { EndedMiddleware } from '../webServer/models/MyMiddleware'
import { MyMiddleware as M } from '../webServer/models/MyMiddleware'

type StaticDataController = ReturnType<typeof StaticDataController>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const StaticDataController = (
  ddragonService: DDragonService,
  staticDataService: StaticDataService,
) => ({
  staticData: (lang: Lang): EndedMiddleware =>
    pipe(staticDataService.getLatest(lang), M.fromTaskEither, M.ichain(M.json(StaticData.codec))),
})

export { StaticDataController }
