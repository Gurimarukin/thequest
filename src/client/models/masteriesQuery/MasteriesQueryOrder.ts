import { createEnum } from '../../../shared/utils/createEnum'

type MasteriesQueryOrder = typeof e.T

const e = createEnum('desc', 'asc')

const default_: MasteriesQueryOrder = 'desc'

const MasteriesQueryOrder = { codec: e.codec, values: e.values, default: default_ }

export { MasteriesQueryOrder }
