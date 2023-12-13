import { apply, readonlyMap } from 'fp-ts'
import { pipe } from 'fp-ts/function'

import { MadosayentisutoInfos } from '../../shared/models/api/MadosayentisutoInfos'
import { DiscordUserId } from '../../shared/models/discord/DiscordUserId'
import { Future, List, getTrivialOrd } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'

import type { MadosayentisutoConfig } from '../config/Config'
import type { TokenContent } from '../models/user/TokenContent'
import type { DiscordService } from '../services/DiscordService'
import type { HallOfFameMemberService } from '../services/HallOfFameMemberService'
import type { RiotAccountService } from '../services/RiotAccountService'
import type { SummonerService } from '../services/SummonerService'
import { MyMiddleware as M } from '../webServer/models/MyMiddleware'
import { WithPermissions } from '../webServer/utils/WithPermissions'

const discordUserIdMapTraversable = readonlyMap.getTraversable(getTrivialOrd(DiscordUserId.Eq))

type AdminController = ReturnType<typeof AdminController>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function AdminController(
  config: MadosayentisutoConfig,
  discordService: DiscordService,
  hallOfFameMemberService: HallOfFameMemberService,
  riotAccountService: RiotAccountService,
  summonerService: SummonerService,
) {
  return {
    listMadosayentisuto: (user: TokenContent) =>
      WithPermissions.admin.madosayentisuto.list(user.role)(
        pipe(
          apply.sequenceT(Future.ApplyPar)(
            discordService.v10.guilds(config.guildId).members.get,
            pipe(
              hallOfFameMemberService.listAll,
              Future.chain(members =>
                discordUserIdMapTraversable.traverse(Future.ApplicativePar)(members, m =>
                  pipe(
                    summonerService.findByPuuid(m.platform, m.puuid),
                    futureMaybe.apS(
                      'riotId',
                      pipe(
                        riotAccountService.findByPuuid(m.puuid),
                        futureMaybe.map(a => a.riotId),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
          Future.map(
            ([guidMembers, hallOfFameMembers]): MadosayentisutoInfos => ({
              guildMembers: pipe(
                guidMembers,
                List.map(m => m.user),
              ),
              hallOfFameMembers: pipe(hallOfFameMembers, readonlyMap.compact),
            }),
          ),
          M.fromTaskEither,
          M.ichain(M.json(MadosayentisutoInfos.codec)),
        ),
      ),
  }
}

export { AdminController }
