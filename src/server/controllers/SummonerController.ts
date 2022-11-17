import { pipe } from 'fp-ts/function'

import type { ChampionMasteryView } from '../../shared/models/api/ChampionMasteryView'
import type { Platform } from '../../shared/models/api/Platform'
import { SummonerMasteriesView } from '../../shared/models/api/SummonerMasteriesView'
import { Future, List } from '../../shared/utils/fp'

import type { RiotApiService } from '../services/RiotApiService'
import type { EndedMiddleware } from '../webServer/models/MyMiddleware'
import { MyMiddleware as M } from '../webServer/models/MyMiddleware'

type SummonerController = ReturnType<typeof SummonerController>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const SummonerController = (riotApiService: RiotApiService) => ({
  byName: (platform: Platform, summonerName: string): EndedMiddleware =>
    pipe(
      riotApiService.lol.summoner.byName(platform, summonerName),
      Future.bindTo('summoner'),
      Future.bind('masteries', ({ summoner }) =>
        riotApiService.lol.championMasteryBySummoner(platform, summoner.id),
      ),
      Future.map(
        ({
          summoner: { name, profileIconId, summonerLevel },
          masteries,
        }): SummonerMasteriesView => ({
          summoner: { name, profileIconId, summonerLevel },
          masteries: pipe(
            masteries,
            List.map(
              ({
                championId,
                championLevel,
                championPoints,
                championPointsSinceLastLevel,
                championPointsUntilNextLevel,
                chestGranted,
                tokensEarned,
              }): ChampionMasteryView => ({
                championId,
                championLevel,
                championPoints,
                championPointsSinceLastLevel,
                championPointsUntilNextLevel,
                chestGranted,
                tokensEarned,
              }),
            ),
          ),
        }),
      ),
      M.fromTaskEither,
      M.ichain(M.json(SummonerMasteriesView.codec)),
    ),
})

export { SummonerController }
