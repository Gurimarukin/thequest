import { apply, readonlyMap } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { Status } from 'hyper-ts'

import { HallOfFameInfos } from '../../shared/models/api/hallOfFame/HallOfFameInfos'
import { HallOfFameMembersPayload } from '../../shared/models/api/hallOfFame/HallOfFameMembersPayload'
import type { SummonerShort } from '../../shared/models/api/summoner/SummonerShort'
import { DiscordUserId } from '../../shared/models/discord/DiscordUserId'
import { Future, List, Maybe, idcOrd } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'

import type { MadosayentisutoConfig } from '../config/Config'
import type { TokenContent } from '../models/user/TokenContent'
import type { DiscordService } from '../services/DiscordService'
import type { HallOfFameMemberService } from '../services/HallOfFameMemberService'
import type { RiotAccountService } from '../services/RiotAccountService'
import type { SummonerService } from '../services/SummonerService'
import { EndedMiddleware, MyMiddleware as M } from '../webServer/models/MyMiddleware'
import { WithPermissions } from '../webServer/utils/WithPermissions'

const discordUserIdMapTraversable = readonlyMap.getTraversable(idcOrd(DiscordUserId.Eq))

type AdminController = ReturnType<typeof AdminController>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function AdminController(
  config: MadosayentisutoConfig,
  discordService: DiscordService,
  hallOfFameMemberService: HallOfFameMemberService,
  riotAccountService: RiotAccountService,
  summonerService: SummonerService,
) {
  const listHallOfFameMembers: Future<ReadonlyMap<DiscordUserId, SummonerShort>> = pipe(
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
    Future.map(readonlyMap.compact),
  )

  return {
    listHallOfFame: (user: TokenContent): EndedMiddleware =>
      WithPermissions.admin.hallOfFame.list(user.role)(
        pipe(
          apply.sequenceT(Future.ApplyPar)(
            discordService.v10.guilds(config.guildId).members.get,
            listHallOfFameMembers,
          ),
          Future.map(
            ([guidMembers, hallOfFameMembers]): HallOfFameInfos => ({
              guildMembers: pipe(
                guidMembers,
                List.map(m => m.user),
              ),
              hallOfFameMembers,
            }),
          ),
          M.fromTaskEither,
          M.ichain(M.json(HallOfFameInfos.codec)),
        ),
      ),

    updateHallOfFame: (user: TokenContent): EndedMiddleware =>
      WithPermissions.admin.hallOfFame.update(user.role)(
        EndedMiddleware.withBody(HallOfFameMembersPayload.codec)(members =>
          pipe(
            discordUserIdMapTraversable.traverse(futureMaybe.ApplicativePar)(
              members,
              ({ platform, puuid }) => summonerService.findByPuuid(platform, puuid),
            ),
            futureMaybe.chainTaskEitherK(hallOfFameMemberService.storeAll),
            M.fromTaskEither,
            M.ichain(
              Maybe.fold(
                () => M.sendWithStatus(Status.BadRequest)('Summoner not found'),
                success =>
                  success
                    ? M.sendWithStatus(Status.NoContent)('')
                    : M.sendWithStatus(Status.InternalServerError)('Internal server error'),
              ),
            ),
          ),
        ),
      ),
  }
}

export { AdminController }
