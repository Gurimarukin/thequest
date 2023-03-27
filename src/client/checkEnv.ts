import { flow, pipe } from 'fp-ts/function'

import { loadDotEnv } from '../shared/utils/config/loadDotEnv'
import type { NotUsed } from '../shared/utils/fp'
import { IO, toNotUsed } from '../shared/utils/fp'

import { Config } from './config/Config'

const main: IO<NotUsed> = pipe(
  loadDotEnv,
  IO.chain(flow(Config.parse, IO.fromEither)),
  IO.map(toNotUsed),
)

// eslint-disable-next-line functional/no-expression-statements
IO.runUnsafe(main)
