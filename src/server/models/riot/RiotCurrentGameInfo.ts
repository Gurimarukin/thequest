import { pipe } from 'fp-ts/function'
import * as D from 'io-ts/Decoder'

import { MsDuration } from '../../../shared/models/MsDuration'
import { Platform } from '../../../shared/models/api/Platform'
import { ChampionKey } from '../../../shared/models/api/champion/ChampionKey'
import { List } from '../../../shared/utils/fp'

import { DayJsFromNumber } from '../../utils/ioTsUtils'
import { SummonerId } from '../summoner/SummonerId'
import { GameId } from './GameId'
import { GameMode } from './GameMode'
import { GameQueue } from './GameQueue'
import { GameType } from './GameType'
import { MapId } from './MapId'
import { TeamId } from './TeamId'

// type RiotGameCustomizationObject = D.TypeOf<typeof riotGameCustomizationObjectDecoder>

const riotGameCustomizationObjectDecoder = D.struct({
  category: D.string, // Category identifier for Game Customization
  content: D.string, // Game Customization content
})

// type RiotPerks = D.TypeOf<typeof riotPerksDecoder>

const riotPerksDecoder = D.struct({
  perkIds: List.decoder(D.number), // IDs of the perks/runes assigned.
  perkStyle: D.number, // Primary runes path
  perkSubStyle: D.number, // Secondary runes path
})

// type RiotCurrentGameParticipant = D.TypeOf<typeof riotCurrentGameParticipantDecoder>

const riotCurrentGameParticipantDecoder = D.struct({
  championId: ChampionKey.codec, // The ID of the champion played by this participant
  perks: riotPerksDecoder, // Perks/Runes Reforged Information
  profileIconId: D.number, // The ID of the profile icon used by this participant
  bot: D.boolean, // Flag indicating whether or not this participant is a bot
  teamId: TeamId.decoder, // The team ID of this participant, indicating the participant's team
  summonerName: D.string, // The summoner name of this participant
  summonerId: SummonerId.codec, // The encrypted summoner ID of this participant
  spell1Id: D.number, // The ID of the first summoner spell used by this participant
  spell2Id: D.number, // The ID of the second summoner spell used by this participant
  gameCustomizationObjects: List.decoder(riotGameCustomizationObjectDecoder), // List of Game Customizations
})

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
  platformId: Platform.codec, // The ID of the platform on which the game is being played
  gameMode: GameMode.decoder, // The game mode
  bannedChampions: List.decoder(riotBannedChampionDecoder), // Banned champion information
  gameQueueConfigId: GameQueue.decoder, // The queue type (queue types are documented on the Game Constants page)
  observers: riotObserver, // The observer information
  participants: List.decoder(riotCurrentGameParticipantDecoder), // The participant information
})

const RiotCurrentGameInfo = { decoder }

export { RiotCurrentGameInfo }
