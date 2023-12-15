import type * as C from 'io-ts/Codec'

import { getTrivialOrd } from '../../../utils/fp'
import { MapFromArray } from '../../../utils/ioTsUtils'
import { DiscordUserId } from '../../discord/DiscordUserId'
import { PlatformWithPuuid } from '../summoner/PlatformWithPuuid'

type HallOfFameMembersPayload = C.TypeOf<typeof codec>

const codec = MapFromArray.codec(getTrivialOrd(DiscordUserId.Eq))(
  DiscordUserId.codec,
  PlatformWithPuuid.codec,
)

const HallOfFameMembersPayload = { codec }

export { HallOfFameMembersPayload }
