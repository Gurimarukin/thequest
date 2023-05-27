import * as D from 'io-ts/Decoder'

import { TeamId } from '../../../../shared/models/api/activeGame/TeamId'
import { ChampionKey } from '../../../../shared/models/api/champion/ChampionKey'
import { RuneId } from '../../../../shared/models/api/perk/RuneId'
import { RuneStyleId } from '../../../../shared/models/api/perk/RuneStyleId'
import { SummonerSpellKey } from '../../../../shared/models/api/summonerSpell/SummonerSpellKey'
import { List } from '../../../../shared/utils/fp'

import { SummonerId } from '../../summoner/SummonerId'

// type RiotGameCustomizationObject = D.TypeOf<typeof riotGameCustomizationObjectDecoder>

const riotGameCustomizationObjectDecoder = D.struct({
  category: D.string, // Category identifier for Game Customization
  content: D.string, // Game Customization content
})

// type RiotPerks = D.TypeOf<typeof riotPerksDecoder>

const riotPerksDecoder = D.struct({
  perkIds: List.decoder(RuneId.codec), // IDs of the perks/runes assigned.
  perkStyle: RuneStyleId.codec, // Primary runes path
  perkSubStyle: RuneStyleId.codec, // Secondary runes path
})

type RiotCurrentGameParticipant = D.TypeOf<typeof decoder>

const decoder = D.struct({
  championId: ChampionKey.codec, // The ID of the champion played by this participant
  perks: riotPerksDecoder, // Perks/Runes Reforged Information
  profileIconId: D.number, // The ID of the profile icon used by this participant
  bot: D.boolean, // Flag indicating whether or not this participant is a bot
  teamId: TeamId.decoder, // The team ID of this participant, indicating the participant's team
  summonerName: D.string, // The summoner name of this participant
  summonerId: SummonerId.codec, // The encrypted summoner ID of this participant
  spell1Id: SummonerSpellKey.codec, // The ID of the first summoner spell used by this participant
  spell2Id: SummonerSpellKey.codec, // The ID of the second summoner spell used by this participant
  gameCustomizationObjects: List.decoder(riotGameCustomizationObjectDecoder), // List of Game Customizations
})

const RiotCurrentGameParticipant = { decoder }

export { RiotCurrentGameParticipant }
