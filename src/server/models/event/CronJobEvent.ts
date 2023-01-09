import type { DayJs } from '../../../shared/models/DayJs'

type CronJobEvent = {
  readonly date: DayJs
}

const of = (date: DayJs): CronJobEvent => ({ date })

const CronJobEvent = { of }

export { CronJobEvent }
