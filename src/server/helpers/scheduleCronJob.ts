import { pipe } from 'fp-ts/function'

import { DayJs } from '../../shared/models/DayJs'
import { MsDuration } from '../../shared/models/MsDuration'
import type { TSubject } from '../../shared/models/rx/TSubject'
import { StringUtils } from '../../shared/utils/StringUtils'
import type { NotUsed } from '../../shared/utils/fp'
import { Future, IO, toNotUsed } from '../../shared/utils/fp'

import { CronJobEvent } from '../models/event/CronJobEvent'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
import { getOnError } from '../utils/getOnError'

// every day at 00:00

const cronJobInterval = MsDuration.day(1)

export const scheduleCronJob = (
  Logger: LoggerGetter,
  subject: TSubject<CronJobEvent>,
): IO<NotUsed> => {
  const logger = Logger('scheduleCronJob')

  return pipe(
    DayJs.now,
    IO.fromIO,
    IO.map(now => {
      const nextDay = pipe(now, DayJs.startOf('day'), DayJs.add(MsDuration.day(1)))
      return pipe(nextDay, DayJs.diff(now))
    }),
    IO.chainFirst(untilNextDay =>
      logger.info(
        `Scheduling; next day is in ${StringUtils.prettyMs(
          untilNextDay,
        )} (interval: ${StringUtils.prettyMs(cronJobInterval)})`,
      ),
    ),
    IO.chainIOK(untilNextDay =>
      pipe(
        setCronJobInterval(),
        Future.fromIOEither,
        Future.delay(untilNextDay),
        IO.runFuture(getOnError(logger)),
      ),
    ),
  )

  function setCronJobInterval(): IO<NotUsed> {
    return pipe(
      publishEvent(),
      IO.chain(() =>
        IO.tryCatch(() =>
          setInterval(
            () => pipe(publishEvent(), IO.run(getOnError(logger))),
            MsDuration.unwrap(cronJobInterval),
          ),
        ),
      ),
      IO.map(toNotUsed),
    )
  }

  function publishEvent(): IO<NotUsed> {
    return pipe(
      DayJs.now,
      IO.fromIO,
      IO.chain(now =>
        subject.next(CronJobEvent.of(pipe(now, DayJs.second.set(0), DayJs.millisecond.set(0)))),
      ), // assuming interval is 1 minute
    )
  }
}
