import { readonlyMap } from 'fp-ts'
import { pipe } from 'fp-ts/function'

import type { PlatformWithPuuid } from '../../shared/models/api/summoner/PlatformWithPuuid'
import { DiscordUserId } from '../../shared/models/discord/DiscordUserId'
import { Future, List, emptyReadonlyMap } from '../../shared/utils/fp'

import type { HallOfFameMemberPersistence } from '../persistence/HallOfFameMemberPersistence'

type HallOfFameMemberService = ReturnType<typeof HallOfFameMemberService>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function HallOfFameMemberService(hallOfFameMemberPersistence: HallOfFameMemberPersistence) {
  const listAll: Future<ReadonlyMap<DiscordUserId, PlatformWithPuuid>> = pipe(
    hallOfFameMemberPersistence.listAll,
    Future.map(
      List.reduce(emptyReadonlyMap<DiscordUserId, PlatformWithPuuid>(), (acc, m) =>
        pipe(
          acc,
          readonlyMap.upsertAt(DiscordUserId.Eq)(m.userId, {
            platform: m.platform,
            puuid: m.puuid,
          }),
        ),
      ),
    ),
  )

  return { listAll }
}

export { HallOfFameMemberService }
