import type { Parser } from 'fp-ts-routing'

import type { Method } from '../../../shared/models/Method'
import { createUnion } from '../../../shared/utils/createUnion'
import type { Tuple } from '../../../shared/utils/fp'

import type { EndedMiddleware } from './MyMiddleware'
import type { UpgradeHandler } from './UpgradeHandler'

type Route = typeof u.T

type RouteMiddleware = typeof u.Middleware.T
type RouteUpgrade = typeof u.Upgrade.T

const u = createUnion({
  Middleware: (middleware: Tuple<Method, Parser<EndedMiddleware>>) => ({ middleware }),
  Upgrade: (upgrade: Parser<UpgradeHandler>) => ({ upgrade }),
})

const Route = {
  Middleware: u.Middleware,
  Upgrade: u.Upgrade,
  is: u.is,
}

export { Route, RouteMiddleware, RouteUpgrade }
