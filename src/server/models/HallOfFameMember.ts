import * as C from 'io-ts/Codec'

import { Platform } from '../../shared/models/api/Platform'
import { Puuid } from '../../shared/models/api/summoner/Puuid'
import { DiscordUserId } from '../../shared/models/discord/DiscordUserId'

type HallOfFameMember = C.TypeOf<typeof codec>
type HallOfFameMemberOutput = C.OutputOf<typeof codec>

const codec = C.struct({
  userId: DiscordUserId.codec,
  puuid: Puuid.codec,
  platform: Platform.codec,
})

const HallOfFameMember = { codec }

export { HallOfFameMember, HallOfFameMemberOutput }
