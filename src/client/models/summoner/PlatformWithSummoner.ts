import { eq } from 'fp-ts'

import { Platform } from '../../../shared/models/api/Platform'
import { RiotId } from '../../../shared/models/riot/RiotId'
import { SummonerName } from '../../../shared/models/riot/SummonerName'
import { Either } from '../../../shared/utils/fp'

type PlatformWithSummoner = {
  platform: Platform
  summoner: Either<SummonerName, RiotId>
}

const Eq: eq.Eq<PlatformWithSummoner> = eq.struct({
  platform: Platform.Eq,
  summoner: Either.getEq(SummonerName.Eq, RiotId.Eq),
})

const PlatformWithSummoner = { Eq }

export { PlatformWithSummoner }
