import { pipe } from 'fp-ts/function'
import * as D from 'io-ts/Decoder'

import { MsDuration } from '../../../../shared/models/MsDuration'
import { ChampionKey } from '../../../../shared/models/api/champion/ChampionKey'
import type { CurrentGameInfoView } from '../../../../shared/models/api/currentGame/CurrentGameInfoView'
import type { CurrentGameParticipantView } from '../../../../shared/models/api/currentGame/CurrentGameParticipantView'
import { GameId } from '../../../../shared/models/api/currentGame/GameId'
import { GameQueue } from '../../../../shared/models/api/currentGame/GameQueue'
import { TeamId } from '../../../../shared/models/api/currentGame/TeamId'
import { List } from '../../../../shared/utils/fp'

import { DayJsFromNumber } from '../../../utils/ioTsUtils'
import { GameMode } from '../GameMode'
import { GameType } from '../GameType'
import { MapId } from '../MapId'
import { RiotCurrentGameParticipant } from './RiotCurrentGameParticipant'

// type RiotBannedChampion = D.TypeOf<typeof riotBannedChampionDecoder>

const riotBannedChampionDecoder = D.struct({
  pickTurn: D.number, // The turn during which the champion was banned
  championId: ChampionKey.codec, // The ID of the banned champion
  teamId: TeamId.decoder, // The ID of the team that banned the champion
})

// type RiotObserver = D.TypeOf<typeof riotObserver>

const riotObserver = D.struct({
  encryptionKey: D.string, // Key used to decrypt the spectator grid game data for playback
})

type RiotCurrentGameInfo = D.TypeOf<typeof decoder>

const decoder = D.struct({
  gameId: GameId.codec, // The ID of the game
  gameType: GameType.decoder, // The game type
  gameStartTime: DayJsFromNumber.decoder, // The game start time represented in epoch milliseconds
  mapId: MapId.decoder, // The ID of the map
  gameLength: pipe(D.number, D.map(MsDuration.seconds)), // The amount of time in seconds that has passed since the game started
  // platformId: PlatformId.codec, // The ID of the platform on which the game is being played
  gameMode: GameMode.decoder, // The game mode
  bannedChampions: List.decoder(riotBannedChampionDecoder), // Banned champion information
  gameQueueConfigId: GameQueue.decoder, // The queue type (queue types are documented on the Game Constants page)
  observers: riotObserver, // The observer information
  participants: List.decoder(RiotCurrentGameParticipant.decoder), // The participant information
})

const toView =
  (participants: List<CurrentGameParticipantView>) =>
  (g: RiotCurrentGameInfo): CurrentGameInfoView => ({
    ...g,
    participants,
  })

const RiotCurrentGameInfo = { decoder, toView }

export { RiotCurrentGameInfo }
