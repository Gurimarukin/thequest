import { pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'
import type { Newtype } from 'newtype-ts'
import { iso } from 'newtype-ts'

import { IO } from '../../../shared/utils/fp'
import { fromNewtype } from '../../../shared/utils/ioTsUtils'

import { UUIDUtils } from '../../utils/UUIDUtils'

type WebUserId = Newtype<{ readonly WebUserId: unique symbol }, string>

const { wrap, unwrap } = iso<WebUserId>()

const codec = fromNewtype<WebUserId>(C.string)

const generate: IO<WebUserId> = pipe(UUIDUtils.uuidV4, IO.map(wrap))

const WebUserId = { wrap, unwrap, codec, generate }

export { WebUserId }
