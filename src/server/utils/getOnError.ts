import { io } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import util from 'util'

import { DayJs } from '../../shared/models/DayJs'
import type { LoggerType } from '../../shared/models/logger/LoggerType'
import type { NotUsed } from '../../shared/utils/fp'
import { Either, toNotUsed } from '../../shared/utils/fp'

import { consoleLogFormat } from '../models/logger/LoggerGetter'

export const getOnError =
  (logger: LoggerType) =>
  (e: Error): io.IO<NotUsed> =>
    pipe(
      logger.error(e),
      io.chain(
        Either.fold(
          () =>
            pipe(
              DayJs.now,
              io.map(
                flow(
                  consoleLogFormat('LogUtils', 'error', util.inspect(e)),
                  console.error,
                  toNotUsed,
                ),
              ),
            ),
          io.of,
        ),
      ),
    )
