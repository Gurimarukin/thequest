import * as C from 'io-ts/Codec'

import { List, getTrivialOrd } from '../../utils/fp'
import { MapFromArray } from '../../utils/ioTsUtils'
import { DiscordUserId } from '../discord/DiscordUserId'
import { SummonerShort } from './summoner/SummonerShort'

type MadosayentisutoInfos = C.TypeOf<typeof codec>

const codec = C.struct({
  guildMembers: List.codec(
    C.struct({
      id: DiscordUserId.codec,
      username: C.string,
    }),
  ),
  hallOfFameMembers: MapFromArray.codec(getTrivialOrd(DiscordUserId.Eq))(
    DiscordUserId.codec,
    SummonerShort.codec,
  ),
})

const MadosayentisutoInfos = { codec }

export { MadosayentisutoInfos }
