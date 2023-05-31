import { pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'
import type { Newtype } from 'newtype-ts'
import { iso } from 'newtype-ts'

import { IO } from '../../../shared/utils/fp'
import { fromNewtype } from '../../../shared/utils/ioTsUtils'

import { UUIDUtils } from '../../utils/UUIDUtils'

type UserId = Newtype<{ readonly UserId: unique symbol }, string>

const { wrap } = iso<UserId>()

const codec = fromNewtype<UserId>(C.string)

const generate: IO<UserId> = pipe(UUIDUtils.uuidV4, IO.map(wrap))

const UserId = { codec, generate }

export { UserId }
