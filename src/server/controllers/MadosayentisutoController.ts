import { apply, monoid, number, string } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import { Status } from 'hyper-ts'
import * as D from 'io-ts/Decoder'

import { Business } from '../../shared/Business'
import type { Lang } from '../../shared/models/api/Lang'
import { ChampionKey } from '../../shared/models/api/champion/ChampionKey'
import { ChampionLevel } from '../../shared/models/api/champion/ChampionLevel'
import { DiscordUserId } from '../../shared/models/discord/DiscordUserId'
import { Sink } from '../../shared/models/rx/Sink'
import { TObservable } from '../../shared/models/rx/TObservable'
import { DictUtils } from '../../shared/utils/DictUtils'
import { NumberUtils } from '../../shared/utils/NumberUtils'
import type { Future } from '../../shared/utils/fp'
import { List, Maybe, NonEmptyArray } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'

import type { MadosayentisutoConfig } from '../config/Config'
import { TheQuestProgression } from '../models/madosayentisuto/TheQuestProgression'
import type { DDragonService } from '../services/DDragonService'
import type { MasteriesService } from '../services/MasteriesService'
import type { SummonerWithDiscordInfos, UserService } from '../services/UserService'
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
  masteriesService: MasteriesService,
  userService: UserService,
  staticDataController: StaticDataController,
) => {
  const getStaticData: EndedMiddleware = withIpAndToken(staticDataController.staticData(lang))

  const getUsersProgression: EndedMiddleware = withIpAndToken(
    EndedMiddleware.withBody(NonEmptyArray.decoder(DiscordUserId.codec))(
      flow(
        userService.findAllByLoginDiscordId,
        TObservable.chainTaskEitherK(userService.getLinkedRiotAccount({ forceCacheRefresh: true })),
        TObservable.chainTaskEitherK(
          flow(futureMaybe.fromOption, futureMaybe.chain(toProgression)),
        ),
        TObservable.compact,
        Sink.readonlyArray,
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
    summoner,
    discord,
  }: SummonerWithDiscordInfos): Future<Maybe<TheQuestProgression>> {
    return pipe(
      // TODO: maybe log failed requests below
      apply.sequenceS(futureMaybe.ApplyPar)({
        masteries: masteriesService.findBySummoner(summoner.platform, summoner.puuid, {
          forceCacheRefresh: true,
        }),
        staticData: futureMaybe.fromTaskEither(ddragonService.latestChampions(lang)),
      }),
      futureMaybe.map(({ masteries: { champions }, staticData }): TheQuestProgression => {
        return {
          userId: discord.id,
          summoner: {
            id: summoner.id,
            platform: summoner.platform,
            name: summoner.name,
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
