import { apply, monoid, number, string } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import { Status } from 'hyper-ts'
import * as D from 'io-ts/Decoder'

import { Business } from '../../shared/Business'
import type { GameId } from '../../shared/models/api/GameId'
import type { Lang } from '../../shared/models/api/Lang'
import type { Platform } from '../../shared/models/api/Platform'
import { ChampionKey } from '../../shared/models/api/champion/ChampionKey'
import { DiscordUserId } from '../../shared/models/discord/DiscordUserId'
import { DictUtils } from '../../shared/utils/DictUtils'
import { NumberUtils } from '../../shared/utils/NumberUtils'
import { Dict, Future, List, Maybe, NonEmptyArray } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'
import { DayJsFromISOString } from '../../shared/utils/ioTsUtils'

import type { MadosayentisutoConfig } from '../config/Config'
import type { HallOfFameMember } from '../models/HallOfFameMember'
import { TheQuestProgression } from '../models/madosayentisuto/TheQuestProgression'
import { MatchDb } from '../models/match/MatchDb'
import type { DDragonService } from '../services/DDragonService'
import type { HallOfFameMemberService } from '../services/HallOfFameMemberService'
import type { MasteriesService } from '../services/MasteriesService'
import type { MatchService } from '../services/MatchService'
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

const MadosayentisutoController = (
  config: MadosayentisutoConfig,
  withIp: WithIp,
  ddragonService: DDragonService,
  hallOfFameMemberService: HallOfFameMemberService,
  masteriesService: MasteriesService,
  matchService: MatchService,
  riotAccountService: RiotAccountService,
  summonerService: SummonerService,
  staticDataController: StaticDataController,
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
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

    getMatch: (platform: Platform, gameId: GameId): EndedMiddleware =>
      withToken(
        pipe(
          matchService.findById(platform, gameId),
          M.fromTaskEither,
          M.ichain(
            Maybe.fold(
              () => M.sendWithStatus(Status.NotFound)(''),
              M.json(MatchDb.codec(DayJsFromISOString.codec)),
            ),
          ),
        ),
      ),

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
      futureMaybe.map(
        ([{ riotId }, summoner, { champions }, staticData]): TheQuestProgression => ({
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
          champions: pipe(
            champions,
            List.filter(m => 5 <= m.championLevel),
            List.groupByStr(m => `${m.championLevel}`),
            Dict.map(NonEmptyArray.map(m => m.championId)),
          ),
        }),
      ),
    )
  }

  function withIpAndToken(m: EndedMiddleware): EndedMiddleware {
    return withIp('madosayentisuto route')(ip =>
      !List.elem(string.Eq)(ip, config.whitelistedIps)
        ? M.sendWithStatus(Status.NotFound)('')
        : withToken(m),
    )
  }

  function withToken(m: EndedMiddleware): EndedMiddleware {
    return pipe(
      M.decodeHeader('authorization', [D.string, 'string']),
      M.matchE(
        () => M.sendWithStatus(Status.BadRequest)(''),
        authorization =>
          string.Eq.equals(authorization, config.token)
            ? m
            : M.sendWithStatus(Status.Unauthorized)(''),
      ),
    )
  }
}

export { MadosayentisutoController }
