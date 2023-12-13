import type { List } from '../../../shared/utils/fp'

export type ToDeleteAndToUpsert<A> = {
  toDelete: List<A>
  toUpsert: List<A>
}
