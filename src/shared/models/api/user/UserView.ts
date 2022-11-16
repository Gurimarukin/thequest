import * as C from 'io-ts/Codec'

import { UserName } from './UserName'

type UserView = C.TypeOf<typeof codec>

const codec = C.struct({
  userName: UserName.codec,
})

const UserView = { codec }

export { UserView }
