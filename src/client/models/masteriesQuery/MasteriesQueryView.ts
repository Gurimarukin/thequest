import { createEnum } from '../../../shared/utils/createEnum'

type MasteriesQueryView = typeof e.T

const e = createEnum('compact', 'histogram', 'aram', 'factions')

const default_: MasteriesQueryView = 'compact'

const MasteriesQueryView = { codec: e.codec, default: default_ }

export { MasteriesQueryView }
