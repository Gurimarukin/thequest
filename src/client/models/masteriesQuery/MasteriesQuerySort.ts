import { createEnum } from '../../../shared/utils/createEnum'

type MasteriesQuerySort = typeof e.T

const e = createEnum('level', 'percents', 'points', 'name')

const default_: MasteriesQuerySort = 'level'

const MasteriesQuerySort = { codec: e.codec, values: e.values, default: default_ }

export { MasteriesQuerySort }
