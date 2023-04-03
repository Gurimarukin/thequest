import type { DayJs } from '../../../shared/models/DayJs'

type CronJobEvent = {
  date: DayJs
}

const of = (date: DayJs): Readonly<CronJobEvent> => ({ date })

const CronJobEvent = { of }

export { CronJobEvent }
