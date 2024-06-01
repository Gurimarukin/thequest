import * as E from 'io-ts/Encoder'

import { Platform } from '../../../shared/models/api/Platform'
import { ChampionKey } from '../../../shared/models/api/champion/ChampionKey'
import { DiscordUserId } from '../../../shared/models/discord/DiscordUserId'
import { RiotId } from '../../../shared/models/riot/RiotId'
import { List } from '../../../shared/utils/fp'

import { SummonerId } from '../summoner/SummonerId'

type TheQuestProgression = E.TypeOf<typeof encoder>

const encoder = E.struct({
  userId: DiscordUserId.codec,
  summoner: E.struct({
    id: SummonerId.codec,
    platform: Platform.codec,
    riotId: RiotId.fromStringCodec,
    profileIconId: E.id<number>(),
  }),
  percents: E.id<number>(),
  totalMasteryLevel: E.id<number>(),
  champions: E.struct({
    mastery10plus: List.encoder(ChampionKey.codec),
    mastery9: List.encoder(ChampionKey.codec),
    mastery8: List.encoder(ChampionKey.codec),
  }),
})

const TheQuestProgression = { encoder }

export { TheQuestProgression }
