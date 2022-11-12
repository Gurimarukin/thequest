import * as C from 'io-ts/Codec'

import { UserName } from '../../../shared/models/webUser/UserName'

import { HashedPassword } from './HashedPassword'
import { WebUserId } from './WebUserId'

type WebUser = C.TypeOf<typeof codec>

const codec = C.struct({
  id: WebUserId.codec,
  userName: UserName.codec,
  password: HashedPassword.codec,
})

const of = (id: WebUserId, userName: UserName, password: HashedPassword): WebUser => ({
  id,
  userName,
  password,
})

const WebUser = { codec, of }

export { WebUser }
