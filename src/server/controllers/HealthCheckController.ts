import { pipe } from 'fp-ts/function'
import { Status } from 'hyper-ts'

import type { HealthCheckService } from '../services/HealthCheckService'
import type { EndedMiddleware } from '../webServer/models/MyMiddleware'
import { MyMiddleware as M } from '../webServer/models/MyMiddleware'

type HealthCheckController = Readonly<ReturnType<typeof HealthCheckController>>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const HealthCheckController = (healthCheckService: HealthCheckService) => {
  const check: EndedMiddleware = pipe(
    M.fromTaskEither(healthCheckService.check()),
    M.ichain(ok =>
      ok ? M.sendWithStatus(Status.OK)('') : M.sendWithStatus(Status.InternalServerError)(''),
    ),
  )

  return { check }
}

export { HealthCheckController }
