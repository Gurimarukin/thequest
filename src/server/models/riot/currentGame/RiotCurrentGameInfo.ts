import { pipe } from 'fp-ts/function'
import * as D from 'io-ts/Decoder'

import { MsDuration } from '../../../../shared/models/MsDuration'
import { GameId } from '../../../../shared/models/api/GameId'
import { MapId } from '../../../../shared/models/api/MapId'
import type { BannedChampion } from '../../../../shared/models/api/activeGame/BannedChampion'
import { GameQueue } from '../../../../shared/models/api/activeGame/GameQueue'
import { TeamId } from '../../../../shared/models/api/activeGame/TeamId'
import { ChampionKey } from '../../../../shared/models/api/champion/ChampionKey'
import type { NonEmptyArray, PartialDict } from '../../../../shared/utils/fp'
import { Either, List, Maybe } from '../../../../shared/utils/fp'

import { DayJsFromNumber } from '../../../utils/ioTsUtils'
import { GameMode } from '../GameMode'
import { GameType } from '../GameType'
import { RiotCurrentGameParticipant } from './RiotCurrentGameParticipant'

const rawBannedChampionDecoder = D.struct({
  pickTurn: D.number, // The turn during which the champion was banned
  championId: pipe(
    ChampionKey.codec,
    D.map(Maybe.fromPredicate(k => ChampionKey.unwrap(k) !== -1)),
  ), // The ID of the banned champion
  teamId: TeamId.decoder, // The ID of the team that banned the champion
})

const rawObserver = D.struct({
  encryptionKey: D.string, // Key used to decrypt the spectator grid game data for playback
})

type RawCurrentGameInfo = D.TypeOf<typeof rawDecoder>

const rawDecoder = D.struct({
  gameId: GameId.codec, // The ID of the game
  gameType: GameType.decoder, // The game type
  gameStartTime: pipe(
    D.number,
    D.parse(n =>
      n === 0
        ? D.success(Maybe.none)
        : pipe(DayJsFromNumber.numberDecoder.decode(n), Either.map(Maybe.some)),
    ),
  ), // The game start time represented in epoch milliseconds
  mapId: MapId.decoder, // The ID of the map
  gameLength: pipe(D.number, D.map(MsDuration.seconds)), // The amount of time in seconds that has passed since the game started
  // platformId: PlatformId.codec, // The ID of the platform on which the game is being played
  gameMode: GameMode.decoder, // The game mode
  bannedChampions: List.decoder(rawBannedChampionDecoder), // Banned champion information
  gameQueueConfigId: GameQueue.decoder, // The queue type (queue types are documented on the Game Constants page)
  observers: rawObserver, // The observer information
  participants: List.decoder(RiotCurrentGameParticipant.rawDecoder), // The participant information
})

type RiotCurrentGameInfo = Omit<RawCurrentGameInfo, 'bannedChampions' | 'participants'> & {
  isDraft: boolean
  bannedChampions: PartialDict<`${TeamId}`, NonEmptyArray<BannedChampion>>
  participants: PartialDict<`${TeamId}`, NonEmptyArray<RiotCurrentGameParticipant>>
}

const decoder = pipe(
  rawDecoder,
  D.map(({ bannedChampions, participants, ...game }): RiotCurrentGameInfo => {
    const groupedBannedChampions = pipe(
      bannedChampions,
      List.groupBy(p => `${p.teamId}`),
    )
    const groupedParticipants = pipe(
      participants,
      List.groupBy(p => `${p.teamId}`),
    )

    return {
      ...game,
      isDraft: List.isNonEmpty(bannedChampions),
      bannedChampions: groupedBannedChampions,
      participants: groupedParticipants,
    }
  }),
)

const RiotCurrentGameInfo = { decoder }

export { RiotCurrentGameInfo }
