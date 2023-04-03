import * as E from 'io-ts/Encoder'

import { DiscordUserId } from '../../../shared/models/discord/DiscordUserId'

type TheQuestProgressionError = E.TypeOf<typeof encoder>

const encoder = E.struct({
  user: DiscordUserId.codec,
  connectionName: E.id<string>(),
})

const of = (user: DiscordUserId, connectionName: string): TheQuestProgressionError => ({
  user,
  connectionName,
})

const TheQuestProgressionError = { encoder, of }

export { TheQuestProgressionError }
