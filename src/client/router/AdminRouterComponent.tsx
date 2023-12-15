import { zero } from 'fp-ts-routing'
import { pipe } from 'fp-ts/function'

import { Permissions } from '../../shared/Permissions'
import { Maybe } from '../../shared/utils/fp'

import { Loading } from '../components/Loading'
import { Navigate } from '../components/Navigate'
import { useUser } from '../contexts/UserContext'
import { AdminHallOfFame } from '../domain/admin/AdminHallOfFame'
import { AsyncState } from '../models/AsyncState'
import { adminParsers, adminRoutes } from './AdminRouter'
import { appRoutes } from './AppRouter'
import type { ElementWithTitle } from './getRouterComponent'
import { e, getRouterComponent } from './getRouterComponent'

const RouterComponent = getRouterComponent(
  zero<ElementWithTitle>()
    .alt(adminParsers.index.map(() => e(<Navigate to={adminRoutes.hallOfFame} replace={true} />)))
    .alt(adminParsers.hallOfFame.map(() => e(<AdminHallOfFame />, () => 'Admin - Hall of Fame'))),
)

const AdminRouterComponent: React.FC = () => {
  const { user } = useUser()

  const { data, error } = AsyncState.toSWR(user)

  if (data === undefined && error === undefined) return <Loading className="my-2 h-5" />

  if (
    data !== undefined &&
    pipe(
      data,
      Maybe.filter(u => Permissions.canViewAdmin(u.role)),
      Maybe.isSome,
    )
  ) {
    return <RouterComponent />
  }

  return <Navigate to={appRoutes.index} replace={true} />
}

export default AdminRouterComponent
