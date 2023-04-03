import * as C from 'io-ts/Codec'

import { ClearPassword } from './ClearPassword'
import { UserName } from './UserName'

type LoginPasswordPayload = C.TypeOf<typeof codec>

const codec = C.struct({
  userName: UserName.codec,
  password: ClearPassword.codec,
})

const LoginPasswordPayload = { codec }

export { LoginPasswordPayload }
