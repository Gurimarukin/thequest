import { pipe } from 'fp-ts/function'

import { DayJs } from '../../shared/models/DayJs'
import type { Platform } from '../../shared/models/api/Platform'
import type { ChampionFaction } from '../../shared/models/api/champion/ChampionFaction'
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
        return pipe(factionIds, Dict.map(challengeById))
      }),
    )
  }
}

export { ChallengesService }

const factionIds: Dict<ChampionFaction, ChallengeId> = {
  bandle: ChallengeId.wrap(303501),
  bilgewater: ChallengeId.wrap(303502),
  demacia: ChallengeId.wrap(303503),
  freljord: ChallengeId.wrap(303504),
  ionia: ChallengeId.wrap(303505),
  ixtal: ChallengeId.wrap(303506),
  noxus: ChallengeId.wrap(303507),
  piltover: ChallengeId.wrap(303508),
  shadowIsles: ChallengeId.wrap(303509),
  shurima: ChallengeId.wrap(303510),
  targon: ChallengeId.wrap(303511),
  void: ChallengeId.wrap(303512),
  zaun: ChallengeId.wrap(303513),
}
