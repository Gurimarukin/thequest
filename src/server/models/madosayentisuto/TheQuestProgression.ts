import * as E from 'io-ts/Encoder'

import { ChampionKey } from '../../../shared/models/api/ChampionKey'
import { PlatformWithName } from '../../../shared/models/api/summoner/PlatformWithName'
import { DiscordUserId } from '../../../shared/models/discord/DiscordUserId'
import { List } from '../../../shared/utils/fp'

type TheQuestProgression = Readonly<E.TypeOf<typeof encoder>>

const encoder = E.struct({
  userId: DiscordUserId.codec,
  summoner: PlatformWithName.codec,
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
