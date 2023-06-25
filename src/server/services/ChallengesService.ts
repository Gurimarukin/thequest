import { pipe } from 'fp-ts/function'

import { DayJs } from '../../shared/models/DayJs'
import type { Platform } from '../../shared/models/api/Platform'
import { ChallengesView } from '../../shared/models/api/challenges/ChallengesView'
import type { Puuid } from '../../shared/models/api/summoner/Puuid'
import { ListUtils } from '../../shared/utils/ListUtils'
import type { Maybe } from '../../shared/utils/fp'
import { Dict, Future } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'

import type { RiotApiCacheTtlConfig } from '../config/Config'
import type { Challenges } from '../models/challenges/Challenges'
import { ChallengeId } from '../models/riot/ChallengId'
import type { ChallengesPersistence } from '../persistence/ChallengesPersistence'
import type { RiotApiService } from './RiotApiService'

type ChallengesService = ReturnType<typeof ChallengesService>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const ChallengesService = (
  riotApiCacheTtl: RiotApiCacheTtlConfig,
  challengesPersistence: ChallengesPersistence,
  riotApiService: RiotApiService,
) => {
  return {
    findBySummoner: (platform: Platform, puuid: Puuid): Future<Maybe<Challenges>> =>
      pipe(
        Future.fromIO(DayJs.now),
        Future.map(DayJs.subtract(riotApiCacheTtl.challenges)),
        Future.chain(insertedAfter => challengesPersistence.findBySummoner(puuid, insertedAfter)),
        futureMaybe.map(c => c.challenges),
        futureMaybe.alt<Challenges>(() =>
          pipe(
            fetchChallenges(platform, puuid),
            futureMaybe.chainFirstTaskEitherK(challenges =>
              pipe(
                Future.fromIO(DayJs.now),
                Future.chain(insertedAt =>
                  challengesPersistence.upsert({ puuid, challenges, insertedAt }),
                ),
              ),
            ),
          ),
        ),
      ),
  }

  function fetchChallenges(platform: Platform, puuid: Puuid): Future<Maybe<Challenges>> {
    return pipe(
      riotApiService.riotgames.platform(platform).lol.challengesV1.playerData(puuid),
      futureMaybe.map(({ challenges }) => {
        const challengeById = pipe(
          challenges,
          ListUtils.findFirstBy(ChallengeId.Eq)(c => c.challengeId),
        )
        return pipe(ChallengesView.id, Dict.map(challengeById))
      }),
    )
  }
}

export { ChallengesService }
