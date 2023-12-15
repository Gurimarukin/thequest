import * as C from 'io-ts/Codec'

import { List, getTrivialOrd } from '../../../utils/fp'
import { MapFromArray } from '../../../utils/ioTsUtils'
import { DiscordUserId } from '../../discord/DiscordUserId'
import { SummonerShort } from '../summoner/SummonerShort'
import { DiscordUserView } from './DiscordUserView'

type MadosayentisutoInfos = C.TypeOf<typeof codec>

const codec = C.struct({
  guildMembers: List.codec(DiscordUserView.codec),
  hallOfFameMembers: MapFromArray.codec(getTrivialOrd(DiscordUserId.Eq))(
    DiscordUserId.codec,
    SummonerShort.codec,
  ),
})

const MadosayentisutoInfos = { codec }

export { MadosayentisutoInfos }
