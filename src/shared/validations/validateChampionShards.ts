import { Either } from '../utils/fp'

export const validateChampionShards = (count: number): Either<string, number> => {
  if (!Number.isInteger(count)) {
    return Either.left('Champion shards count should be integer')
  }
  if (count < 0 || 9 < count) {
    return Either.left('Champion shards count should be between 0 and 9')
  }
  return Either.right(Math.round(count))
}
