import { pipe } from 'fp-ts/function'

import type { Dict } from '../../shared/utils/fp'
import { Try } from '../../shared/utils/fp'

import { Config } from './Config'

// It's important to have process.env.ENV_VAR fully, as it is inlined by Parcel
const inlined: Dict<string, string | undefined> = {
  IS_DEV: process.env.IS_DEV,
  API_HOST: process.env.API_HOST,
  CLIENT_ID: process.env.CLIENT_ID,
  REDIRECT_URI: process.env.REDIRECT_URI,
}

export const config: Config = pipe(inlined, Config.parse, Try.getUnsafe)
