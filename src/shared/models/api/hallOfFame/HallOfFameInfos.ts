import * as C from 'io-ts/Codec'

import { List, idcOrd } from '../../../utils/fp'
import { MapFromArray } from '../../../utils/ioTsUtils'
import { DiscordUserId } from '../../discord/DiscordUserId'
import { SummonerShort } from '../summoner/SummonerShort'
import { DiscordUserView } from './DiscordUserView'

type HallOfFameInfos = C.TypeOf<typeof codec>

const codec = C.struct({
  guildMembers: List.codec(DiscordUserView.codec),
  hallOfFameMembers: MapFromArray.codec(idcOrd(DiscordUserId.Eq))(
    DiscordUserId.codec,
    SummonerShort.codec,
  ),
})

const HallOfFameInfos = { codec }

export { HallOfFameInfos }
