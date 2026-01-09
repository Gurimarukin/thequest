import * as E from 'io-ts/Encoder'

import { Platform } from '../../../shared/models/api/Platform'
import { ChampionKey } from '../../../shared/models/api/champion/ChampionKey'
import { Puuid } from '../../../shared/models/api/summoner/Puuid'
import { DiscordUserId } from '../../../shared/models/discord/DiscordUserId'
import { RiotId } from '../../../shared/models/riot/RiotId'
import { NonEmptyArray } from '../../../shared/utils/fp'

type TheQuestProgression = E.TypeOf<typeof encoder>

const encoder = E.struct({
  userId: DiscordUserId.codec,
  summoner: E.struct({
    puuid: Puuid.codec,
    platform: Platform.codec,
    riotId: RiotId.fromStringCodec,
    profileIconId: E.id<number>(),
  }),
  percents: E.id<number>(),
  totalMasteryLevel: E.id<number>(),
  totalMasteryPoints: E.id<number>(),
  champions: E.record(NonEmptyArray.encoder(ChampionKey.codec)), // champion level as keys
})

const TheQuestProgression = { encoder }

export { TheQuestProgression }
