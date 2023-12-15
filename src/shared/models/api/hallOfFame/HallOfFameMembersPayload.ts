import type * as C from 'io-ts/Codec'

import { idcOrd } from '../../../utils/fp'
import { MapFromArray } from '../../../utils/ioTsUtils'
import { DiscordUserId } from '../../discord/DiscordUserId'
import { PlatformWithPuuid } from '../summoner/PlatformWithPuuid'

type HallOfFameMembersPayload = C.TypeOf<typeof codec>

const codec = MapFromArray.codec(idcOrd(DiscordUserId.Eq))(
  DiscordUserId.codec,
  PlatformWithPuuid.codec,
)

const HallOfFameMembersPayload = { codec }

export { HallOfFameMembersPayload }
