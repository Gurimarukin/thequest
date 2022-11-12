import * as C from 'io-ts/Codec'

import { WebUserId } from './WebUserId'

type TokenContent = C.TypeOf<typeof codec>

const codec = C.struct({
  id: WebUserId.codec,
})

const TokenContent = { codec }

export { TokenContent }
