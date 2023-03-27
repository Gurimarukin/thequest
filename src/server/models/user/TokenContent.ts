import * as C from 'io-ts/Codec'

import { UserId } from './UserId'

type TokenContent = Readonly<C.TypeOf<typeof codec>>

const codec = C.struct({
  id: UserId.codec,
})

const TokenContent = { codec }

export { TokenContent }
