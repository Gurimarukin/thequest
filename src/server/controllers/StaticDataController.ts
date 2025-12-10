import { pipe } from 'fp-ts/function'

import type { Lang } from '../../shared/models/api/Lang'
import { AdditionalStaticData } from '../../shared/models/api/staticData/AdditionalStaticData'
import { StaticData } from '../../shared/models/api/staticData/StaticData'
import type { Maybe } from '../../shared/utils/fp'

import type { TokenContent } from '../models/user/TokenContent'
import type { StaticDataService } from '../services/staticDataService/StaticDataService'
import type { EndedMiddleware } from '../webServer/models/MyMiddleware'
import { MyMiddleware as M } from '../webServer/models/MyMiddleware'
import { validateSoftEncoder } from '../webServer/utils/permissions'

type StaticDataController = ReturnType<typeof StaticDataController>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const StaticDataController = (staticDataService: StaticDataService) => ({
  staticData:
    (lang: Lang) =>
    (maybeUser: Maybe<TokenContent>): EndedMiddleware =>
      pipe(
        staticDataService.getLatest(lang),
        M.fromTaskEither,
        M.ichain(M.json(validateSoftEncoder(maybeUser, StaticData.codec))),
      ),

  additionalStaticData: (lang: Lang): EndedMiddleware =>
    pipe(
      staticDataService.getLatestAdditional(lang),
      M.fromTaskEither,
      M.ichain(M.json(AdditionalStaticData.codec)),
    ),
})

export { StaticDataController }
