import * as C from 'io-ts/Codec'
import type { Newtype } from 'newtype-ts'
import { iso } from 'newtype-ts'

import { fromNewtype } from '../../../shared/utils/ioTsUtils'

type TagLine = Newtype<{ readonly TagLine: unique symbol }, string>

const { wrap } = iso<TagLine>()

const codec = fromNewtype<TagLine>(C.string)

const TagLine = { wrap, codec }

export { TagLine }
