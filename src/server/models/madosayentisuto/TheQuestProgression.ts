import * as E from 'io-ts/Encoder'

import { ChampionKey } from '../../../shared/models/api/ChampionKey'
import { Platform } from '../../../shared/models/api/Platform'
import { DiscordUserId } from '../../../shared/models/discord/DiscordUserId'
import { List } from '../../../shared/utils/fp'

import { SummonerId } from '../summoner/SummonerId'

type TheQuestProgression = Readonly<E.TypeOf<typeof encoder>>

const encoder = E.struct({
  userId: DiscordUserId.codec,
  summoner: E.struct({
    id: SummonerId.codec,
    platform: Platform.codec,
    name: E.id<string>(),
    profileIconId: E.id<number>(),
  }),
  percents: E.id<number>(),
  totalMasteryLevel: E.id<number>(),
  champions: E.struct({
    mastery7: List.encoder(ChampionKey.codec),
    mastery6: List.encoder(ChampionKey.codec),
    mastery5: List.encoder(ChampionKey.codec),
  }),
})

const TheQuestProgression = { encoder }

export { TheQuestProgression }
