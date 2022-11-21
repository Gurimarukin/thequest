import { createEnum } from '../../../shared/utils/createEnum'

type MasteriesQuerySort = typeof e.T

const e = createEnum('percents', 'points')

const default_: MasteriesQuerySort = 'percents'

const MasteriesQuerySort = { codec: e.codec, default: default_ }

export { MasteriesQuerySort }
