import { ord } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { DayJs } from '../../shared/models/DayJs'
import type { MsDuration } from '../../shared/models/MsDuration'

type StoredAt<A> = {
  value: A
  storedAt: DayJs
}

const StoredAt = {
  /**
   *                 ttl
   *  <-------------------------------->
   * |----------------|-----------------|
   * now - ttl     storedAt           now
   */
  isStillValid:
    (ttl: MsDuration, now: DayJs) =>
    <A>({ storedAt }: StoredAt<A>): boolean =>
      ord.leq(DayJs.Ord)(pipe(now, DayJs.subtract(ttl)), storedAt),
}

export { StoredAt }
