import { createEnum } from '../../../shared/utils/createEnum'

type MasteriesQueryOrder = typeof e.T

const e = createEnum('asc', 'desc')

const default_: MasteriesQueryOrder = 'desc'

const MasteriesQueryOrder = { codec: e.codec, default: default_ }

export { MasteriesQueryOrder }
