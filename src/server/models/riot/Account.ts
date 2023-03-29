import * as D from 'io-ts/Decoder'

import { UnencryptedPuuid } from './UnencryptedPuuid'

type Account = Readonly<D.TypeOf<typeof decoder>>

const decoder = D.struct({
  puuid: UnencryptedPuuid.codec,
  gameName: D.string,
  tagLine: D.string,
})

const Account = { decoder }

export { Account }
