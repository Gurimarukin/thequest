import { readonlyMap } from 'fp-ts'
import { pipe } from 'fp-ts/function'

import type { PlatformWithPuuid } from '../../shared/models/api/summoner/PlatformWithPuuid'
import { DiscordUserId } from '../../shared/models/discord/DiscordUserId'
import { Future, List, emptyReadonlyMap, idcOrd } from '../../shared/utils/fp'

import type { HallOfFameMember } from '../models/HallOfFameMember'
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

  return {
    listAll,

    listForUsers: hallOfFameMemberPersistence.listForUsers,

    storeAll: (members: ReadonlyMap<DiscordUserId, PlatformWithPuuid>): Future<boolean> =>
      pipe(
        hallOfFameMemberPersistence.deleteAll,
        Future.chain(a => {
          const list = pipe(
            members,
            readonlyMap.toReadonlyArray(idcOrd(DiscordUserId.Eq)),
            List.map(
              ([userId, { puuid, platform }]): HallOfFameMember => ({ userId, puuid, platform }),
            ),
          )

          return pipe(
            List.isNonEmpty(list)
              ? hallOfFameMemberPersistence.insertMany(list)
              : Future.successful(true),
            Future.map(b => a && b),
          )
        }),
      ),
  }
}

export { HallOfFameMemberService }
