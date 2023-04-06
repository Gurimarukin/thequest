import * as dotenv from 'dotenv'
import { pipe } from 'fp-ts/function'

import type { Dict } from '../fp'
import { IO } from '../fp'

export const loadDotEnv: IO<Dict<string, string>> = pipe(
  IO.tryCatch(() => dotenv.config()),
  IO.chain(result =>
    result.parsed !== undefined
      ? IO.successful(result.parsed)
      : result.error !== undefined
      ? IO.failed(result.error)
      : IO.failed(Error('result.error was undefined')),
  ),
)
