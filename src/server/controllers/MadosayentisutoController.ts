import { apply, monoid, number, string } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import { Status } from 'hyper-ts'
import * as D from 'io-ts/Decoder'

import { Business } from '../../shared/Business'
import { ChampionKey } from '../../shared/models/api/ChampionKey'
import { ChampionLevel } from '../../shared/models/api/ChampionLevel'
import { Lang } from '../../shared/models/api/Lang'
import { DiscordUserId } from '../../shared/models/discord/DiscordUserId'
import { Sink } from '../../shared/models/rx/Sink'
import { TObservable } from '../../shared/models/rx/TObservable'
import type { Future } from '../../shared/utils/fp'
import { Dict, Either, List, Maybe, NonEmptyArray } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'

import type { MadosayentisutoConfig } from '../config/Config'
import type { TheQuestProgression } from '../models/madosayentisuto/TheQuestProgression'
import { TheQuestProgressionResult } from '../models/madosayentisuto/TheQuestProgressionResult'
import type { DDragonService } from '../services/DDragonService'
import type { MasteriesService } from '../services/MasteriesService'
import type { SummonerService } from '../services/SummonerService'
import type { SummonerWithDiscordInfos, UserService } from '../services/UserService'
import { EndedMiddleware, MyMiddleware as M } from '../webServer/models/MyMiddleware'
import type { WithIp } from '../webServer/utils/WithIp'
import type { StaticDataController } from './StaticDataController'

/**
 * `madosayentisuto`: any third party app (needs to be authorized with token)
 */

type MadosayentisutoController = Readonly<ReturnType<typeof MadosayentisutoController>>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const MadosayentisutoController = (
  config: MadosayentisutoConfig,
  withIp: WithIp,
  ddragonService: DDragonService,
  masteriesService: MasteriesService,
  summonerService: SummonerService,
  userService: UserService,
  staticDataController: StaticDataController,
) => {
  const getStaticData: EndedMiddleware = withIpAndToken(
    staticDataController.staticData(Lang.defaultLang),
  )

  const getUsersProgression: EndedMiddleware = withIpAndToken(
    EndedMiddleware.withBody(NonEmptyArray.decoder(DiscordUserId.codec))(
      flow(
        userService.findAllByLoginDiscordId,
        TObservable.chainTaskEitherK(userService.getLinkedRiotAccount({ forceCacheRefresh: true })),
        TObservable.chainTaskEitherK(
          Maybe.fold(
            () => futureMaybe.none,
            Either.fold(
              flow(Either.left, futureMaybe.some),
              flow(
                toProgression,
                futureMaybe.map<TheQuestProgression, Either<string, TheQuestProgression>>(
                  Either.right,
                ),
              ),
            ),
          ),
        ),
        TObservable.filterMap(Maybe.map(TheQuestProgressionResult.fromEither)),
        Sink.readonlyArray,
        M.fromTaskEither,
        M.ichain(M.json(List.encoder(TheQuestProgressionResult.encoder))),
      ),
    ),
  )

  return {
    getStaticData,
    getUsersProgression,
  }

  function toProgression({
    summoner,
    discord,
  }: SummonerWithDiscordInfos): Future<Maybe<TheQuestProgression>> {
    return pipe(
      // TODO: maybe log failed requests below
      apply.sequenceS(futureMaybe.ApplyPar)({
        masteries: masteriesService.findBySummoner(summoner.platform, summoner.id, {
          forceCacheRefresh: true,
        }),
        staticData: futureMaybe.fromTaskEither(
          ddragonService.latestDataChampions(Lang.defaultLang),
        ),
      }),
      futureMaybe.map(({ masteries, staticData }): TheQuestProgression => {
        const percents: List<number> = pipe(
          staticData.champions.data,
          Dict.toReadonlyArray,
          List.map(([, { key }]) =>
            pipe(
              masteries,
              List.findFirst(m => ChampionKey.Eq.equals(m.championId, key)),
              Maybe.fold(() => 0, Business.championPercents),
            ),
          ),
        )
        const filteredByLevel = (level: ChampionLevel): List<ChampionKey> =>
          pipe(
            masteries,
            List.filterMap(m =>
              ChampionLevel.Eq.equals(m.championLevel, level)
                ? Maybe.some(m.championId)
                : Maybe.none,
            ),
          )
        return {
          userId: discord.id,
          summoner: {
            id: summoner.id,
            platform: summoner.platform,
            name: summoner.name,
            profileIconId: summoner.profileIconId,
          },
          percents: pipe(percents, monoid.concatAll(number.MonoidSum)) / percents.length,
          totalMasteryLevel: pipe(
            masteries,
            List.map(m => m.championLevel),
            monoid.concatAll(number.MonoidSum),
          ),
          champions: {
            mastery7: filteredByLevel(7),
            mastery6: filteredByLevel(6),
            mastery5: filteredByLevel(5),
          },
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
