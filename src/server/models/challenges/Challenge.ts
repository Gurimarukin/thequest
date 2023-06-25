import type { DayJs } from '../../../shared/models/DayJs'
import type { ChallengeId } from '../../../shared/models/api/ChallengeId'
import type { LeagueTier } from '../../../shared/models/api/league/LeagueTier'
import type { Maybe } from '../../../shared/utils/fp'

type Challenge = {
  challengeId: ChallengeId
  percentile: number
  level: Maybe<LeagueTier>
  value: number
  achievedTime: Maybe<DayJs>
}

export { Challenge }
