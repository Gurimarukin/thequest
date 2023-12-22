import { pipe } from 'fp-ts/function'

import type { GameId } from '../../shared/models/api/GameId'
import { Platform } from '../../shared/models/api/Platform'
import { Future, Maybe } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'

import type { MatchDb } from '../models/match/MatchDb'
import { RiotMatch } from '../models/riot/match/RiotMatch'
import type { MatchPersistence } from '../persistence/MatchPersistence'
import type { RiotApiService } from './RiotApiService'

type MatchService = ReturnType<typeof MatchService>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function MatchService(matchPersistence: MatchPersistence, riotApiService: RiotApiService) {
  return {
    findById: (platform: Platform, gameId: GameId): Future<Maybe<MatchDb>> =>
      pipe(
        matchPersistence.findById(gameId),
        Future.chain(
          Maybe.fold<MatchDb, Future<Maybe<MatchDb>>>(
            () =>
              pipe(
                riotApiService.riotgames.regional.lol.matchV5.matches(platform, gameId),
                futureMaybe.map(RiotMatch.toMatchDb(platform)),
                futureMaybe.chainFirstTaskEitherK(match => matchPersistence.insert(match)),
              ),
            match =>
              Platform.Eq.equals(match.platform, platform)
                ? futureMaybe.some(match)
                : futureMaybe.none,
          ),
        ),
      ),
  }
}

export { MatchService }
