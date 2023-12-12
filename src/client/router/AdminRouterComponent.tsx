import { zero } from 'fp-ts-routing'

import { Navigate } from '../components/Navigate'
import { AdminMadosayentisuto } from '../domain/admin/AdminMadosayentisuto'
import { adminParsers, adminRoutes } from './AdminRouter'
import type { ElementWithTitle } from './getRouterComponent'
import { e, getRouterComponent } from './getRouterComponent'

const AdminRouterComponent = getRouterComponent(
  zero<ElementWithTitle>()
    .alt(
      adminParsers.index.map(() => e(<Navigate to={adminRoutes.madosayentisuto} replace={true} />)),
    )
    .alt(
      adminParsers.madosayentisuto.map(() =>
        e(<AdminMadosayentisuto />, () => 'Admin - Madosayentisuto'),
      ),
    ),
)

export default AdminRouterComponent
