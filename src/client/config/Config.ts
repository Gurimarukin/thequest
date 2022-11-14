import { pipe } from 'fp-ts/function'

import { ValidatedNea } from '../../shared/models/ValidatedNea'
import { parseConfig } from '../../shared/utils/config/parseConfig'
import type { Dict, Try } from '../../shared/utils/fp'
import { Either, Maybe } from '../../shared/utils/fp'
import { URLFromString } from '../../shared/utils/ioTsUtils'

import { BooleanFromString } from '../utils/ioTsUtils'

const seqS = ValidatedNea.getSeqS<string>()

export type Config = {
  readonly isDev: boolean
  readonly apiHost: URL
}

const parse = (rawConfig: Dict<string, string | undefined>): Try<Config> =>
  parseConfig(rawConfig)(r =>
    seqS<Config>({
      isDev: pipe(
        r(Maybe.decoder(BooleanFromString.decoder))('IS_DEV'),
        Either.map(Maybe.getOrElseW(() => false)),
      ),
      apiHost: r(URLFromString.decoder)('API_HOST'),
    }),
  )

export const Config = { parse }
