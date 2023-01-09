import { flow, pipe } from 'fp-ts/function'
import util from 'util'

import { DayJs } from '../../../shared/models/DayJs'
import { LogLevel, LogLevelOrOff } from '../../../shared/models/logger/LogLevel'
import type { LoggerType } from '../../../shared/models/logger/LoggerType'
import type { NotUsed } from '../../../shared/utils/fp'
import { IO, toNotUsed } from '../../../shared/utils/fp'

type LoggerGetter = (name: string) => LoggerType

const LoggerGetter = (logLevel: LogLevelOrOff): LoggerGetter => {
  return name => ({
    trace: (...params) => log(name, 'trace', util.format(...params)),
    debug: (...params) => log(name, 'debug', util.format(...params)),
    info: (...params) => log(name, 'info', util.format(...params)),
    warn: (...params) => log(name, 'warn', util.format(...params)),
    error: (...params) => log(name, 'error', util.format(...params)),
  })

  function log(name: string, level: LogLevel, message: string): IO<NotUsed> {
    return LogLevelOrOff.value[level] <= LogLevelOrOff.value[logLevel]
      ? pipe(
          DayJs.now,
          IO.fromIO,
          IO.map(flow(consoleLogFormat(name, level, message), console.log, toNotUsed)),
        )
      : IO.notUsed
  }
}

export { LoggerGetter }

export const consoleLogFormat =
  (name: string, level: LogLevel, msg: string) =>
  (now: DayJs): string => {
    const withName = `${name} - ${msg}`
    const withTimestamp = `${color(formatDate(now), '30;1')} ${withName}`
    const c = LogLevel.shellColor[level]
    return level === 'info' || level === 'warn'
      ? `${color(level.toUpperCase(), c)}  ${withTimestamp}`
      : `${color(level.toUpperCase(), c)} ${withTimestamp}`
  }

const color = (s: string, c: string): string => (process.stdout.isTTY ? `\x1B[${c}m${s}\x1B[0m` : s)

const formatDate: (d: DayJs) => string = DayJs.format('YYYY/MM/DD HH:mm:ss')
