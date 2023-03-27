import { pipe } from 'fp-ts/function'
import * as D from 'io-ts/Decoder'

import { MsDuration } from '../../../shared/models/MsDuration'

import { AccessToken } from './AccessToken'
import { RefreshToken } from './RefreshToken'

type OAuth2AccessTokenResult = Readonly<D.TypeOf<typeof decoder>>

const decoder = D.struct({
  access_token: AccessToken.codec,
  expires_in: pipe(D.number, D.map(MsDuration.seconds)),
  refresh_token: RefreshToken.codec,
  scope: D.string, // 'identify connections' or 'connections identify'
  token_type: D.literal('Bearer'),
})

const OAuth2AccessTokenResult = { decoder }

export { OAuth2AccessTokenResult }
