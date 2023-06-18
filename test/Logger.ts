import { IO, NotUsed } from '../src/shared/utils/fp'

import type { LoggerGetter } from '../src/server/models/logger/LoggerGetter'

const log = (): IO<NotUsed> => IO.successful(NotUsed)

export const Logger: LoggerGetter = () => ({
  trace: log,
  debug: log,
  info: log,
  warn: log,
  error: log,
})
