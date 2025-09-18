import { createEnum } from '../../../shared/utils/createEnum'
import { List } from '../../../shared/utils/fp'

type MasteriesQueryViewBalance = (typeof balanceViews)[number]

const balanceViews = ['aram', 'urf'] as const

type MasteriesQueryView = typeof e.T

const e = createEnum('compact', 'histogram', ...balanceViews, 'factions')

const default_: MasteriesQueryView = 'compact'

function isBalance(view: MasteriesQueryView): view is MasteriesQueryViewBalance {
  return List.elem(e.Eq)(view, balanceViews)
}

const MasteriesQueryView = { ...e, default: default_, isBalance }

export { MasteriesQueryView }
