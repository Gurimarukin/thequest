import type { DayJs } from '../../../shared/models/DayJs'
import type { LeagueTier } from '../../../shared/models/api/league/LeagueTier'
import type { Maybe } from '../../../shared/utils/fp'

import type { ChallengeId } from '../riot/ChallengId'

type Challenge = {
  challengeId: ChallengeId
  percentile: number
  level: Maybe<LeagueTier>
  value: number
  achievedTime: Maybe<DayJs>
}

export { Challenge }
