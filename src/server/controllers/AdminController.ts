import { pipe } from 'fp-ts/function'
import * as E from 'io-ts/Encoder'

import { List } from '../../shared/utils/fp'

import type { MadosayentisutoConfig } from '../config/Config'
import type { TokenContent } from '../models/user/TokenContent'
import type { DiscordService } from '../services/DiscordService'
import { MyMiddleware as M } from '../webServer/models/MyMiddleware'
import { WithPermissions } from '../webServer/utils/WithPermissions'

type AdminController = ReturnType<typeof AdminController>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function AdminController(config: MadosayentisutoConfig, discordService: DiscordService) {
  return {
    listMadosayentisuto: (user: TokenContent) =>
      WithPermissions.admin.madosayentisuto.list(user.role)(
        pipe(
          discordService.v10.guilds(config.guildId).members.get,
          M.fromTaskEither,
          M.ichain(M.json(List.encoder(E.id<unknown>()))),
        ),
      ),
  }
}

export { AdminController }
