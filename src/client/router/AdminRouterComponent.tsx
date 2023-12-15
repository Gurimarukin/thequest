import { zero } from 'fp-ts-routing'

import { Loading } from '../components/Loading'
import { Navigate } from '../components/Navigate'
import { useUser } from '../contexts/UserContext'
import { AdminHallOfFame } from '../domain/admin/AdminHallOfFame'
import { AsyncState } from '../models/AsyncState'
import { adminParsers, adminRoutes } from './AdminRouter'
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

  return <RouterComponent />
}

export default AdminRouterComponent
