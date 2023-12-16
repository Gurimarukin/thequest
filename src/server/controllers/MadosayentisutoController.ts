import { apply, monoid, number, string } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import { Status } from 'hyper-ts'
import * as D from 'io-ts/Decoder'

import { Business } from '../../shared/Business'
import type { Lang } from '../../shared/models/api/Lang'
import { ChampionKey } from '../../shared/models/api/champion/ChampionKey'
import { ChampionLevel } from '../../shared/models/api/champion/ChampionLevel'
import { DiscordUserId } from '../../shared/models/discord/DiscordUserId'
import { DictUtils } from '../../shared/utils/DictUtils'
import { NumberUtils } from '../../shared/utils/NumberUtils'
import { Future, List, Maybe, NonEmptyArray } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'

import type { MadosayentisutoConfig } from '../config/Config'
import type { HallOfFameMember } from '../models/HallOfFameMember'
import { TheQuestProgression } from '../models/madosayentisuto/TheQuestProgression'
import type { DDragonService } from '../services/DDragonService'
import type { HallOfFameMemberService } from '../services/HallOfFameMemberService'
import type { MasteriesService } from '../services/MasteriesService'
import type { RiotAccountService } from '../services/RiotAccountService'
import type { SummonerService } from '../services/SummonerService'
import { EndedMiddleware, MyMiddleware as M } from '../webServer/models/MyMiddleware'
import type { WithIp } from '../webServer/utils/WithIp'
import type { StaticDataController } from './StaticDataController'

const lang: Lang = 'fr_FR'

/**
 * `madosayentisuto`: any third party app (needs to be authorized with token)
 */

type MadosayentisutoController = ReturnType<typeof MadosayentisutoController>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const MadosayentisutoController = (
  config: MadosayentisutoConfig,
  withIp: WithIp,
  ddragonService: DDragonService,
  hallOfFameMemberService: HallOfFameMemberService,
  masteriesService: MasteriesService,
  riotAccountService: RiotAccountService,
  summonerService: SummonerService,
  staticDataController: StaticDataController,
) => {
  const getStaticData: EndedMiddleware = withIpAndToken(staticDataController.staticData(lang))

  const getUsersProgression: EndedMiddleware = withIpAndToken(
    EndedMiddleware.withBody(NonEmptyArray.decoder(DiscordUserId.codec))(
      flow(
        hallOfFameMemberService.listForUsers,
        Future.chain(List.traverse(Future.ApplicativePar)(toProgression)),
        Future.map(List.compact),
        M.fromTaskEither,
        M.ichain(M.json(List.encoder(TheQuestProgression.encoder))),
      ),
    ),
  )

  return {
    getStaticData,
    getUsersProgression,
  }

  function toProgression({
    userId,
    platform,
    puuid,
  }: HallOfFameMember): Future<Maybe<TheQuestProgression>> {
    return pipe(
      // TODO: maybe log failed requests below
      apply.sequenceT(futureMaybe.ApplyPar)(
        riotAccountService.findByPuuid(puuid),
        summonerService.findByPuuid(platform, puuid),
        masteriesService.findBySummoner(platform, puuid, {
          forceCacheRefresh: true,
        }),
        futureMaybe.fromTaskEither(ddragonService.latestChampions(lang)),
      ),
      futureMaybe.map(([{ riotId }, summoner, { champions }, staticData]): TheQuestProgression => {
        return {
          userId,
          summoner: {
            id: summoner.id,
            platform: summoner.platform,
            riotId,
            profileIconId: summoner.profileIconId,
          },
          percents: pipe(
            staticData.value.data,
            DictUtils.entries,
            List.map(([, { key }]) =>
              pipe(
                champions,
                List.findFirst(m => ChampionKey.Eq.equals(m.championId, key)),
                Maybe.fold(() => 0, Business.championPercents),
              ),
            ),
            NumberUtils.average,
          ),
          totalMasteryLevel: pipe(
            champions,
            List.map(m => m.championLevel),
            monoid.concatAll(number.MonoidSum),
          ),
          champions: {
            mastery7: filteredByLevel(7),
            mastery6: filteredByLevel(6),
            mastery5: filteredByLevel(5),
          },
        }

        function filteredByLevel(level: ChampionLevel): List<ChampionKey> {
          return pipe(
            champions,
            List.filterMap(m =>
              ChampionLevel.Eq.equals(m.championLevel, level)
                ? Maybe.some(m.championId)
                : Maybe.none,
            ),
          )
        }
      }),
    )
  }

  function withIpAndToken(m: EndedMiddleware): EndedMiddleware {
    return withIp('madosayentisuto route')(ip =>
      !List.elem(string.Eq)(ip, config.whitelistedIps)
        ? M.sendWithStatus(Status.NotFound)('')
        : pipe(
            M.decodeHeader('authorization', [D.string, 'string']),
            M.matchE(
              () => M.sendWithStatus(Status.BadRequest)(''),
              authorization =>
                string.Eq.equals(authorization, config.token)
                  ? m
                  : M.sendWithStatus(Status.Unauthorized)(''),
            ),
          ),
    )
  }
}

export { MadosayentisutoController }
