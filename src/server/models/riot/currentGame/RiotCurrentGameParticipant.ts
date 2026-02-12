import { pipe } from 'fp-ts/function'
import * as D from 'io-ts/Decoder'

import { TeamId } from '../../../../shared/models/api/activeGame/TeamId'
import { ChampionKey } from '../../../../shared/models/api/champion/ChampionKey'
import { RuneId } from '../../../../shared/models/api/perk/RuneId'
import { RuneStyleId } from '../../../../shared/models/api/perk/RuneStyleId'
import { Puuid } from '../../../../shared/models/api/summoner/Puuid'
import { SummonerSpellKey } from '../../../../shared/models/api/summonerSpell/SummonerSpellKey'
import { RiotId } from '../../../../shared/models/riot/RiotId'
import { List, Maybe } from '../../../../shared/utils/fp'

const rawGameCustomizationObjectDecoder = D.struct({
  category: D.string, // Category identifier for Game Customization
  content: D.string, // Game Customization content
})

const rawPerksDecoder = D.struct({
  perkIds: List.decoder(RuneId.codec), // IDs of the perks/runes assigned.
  perkStyle: RuneStyleId.codec, // Primary runes path
  perkSubStyle: RuneStyleId.codec, // Secondary runes path
})

const rawCommon = D.struct({
  championId: ChampionKey.codec, // The ID of the champion played by this participant
  perks: Maybe.decoder(rawPerksDecoder), // Perks/Runes Reforged Information
  profileIconId: D.number, // The ID of the profile icon used by this participant
  bot: D.boolean, // Flag indicating whether or not this participant is a bot
  teamId: TeamId.decoder, // The team ID of this participant, indicating the participant's team
  spell1Id: SummonerSpellKey.codec, // The ID of the first summoner spell used by this participant
  spell2Id: SummonerSpellKey.codec, // The ID of the second summoner spell used by this participant
  gameCustomizationObjects: List.decoder(rawGameCustomizationObjectDecoder), // List of Game Customizations
})

const rawStreamer = pipe(
  D.struct({
    puuid: D.literal(null),
    // riotId: D.string, // champion name
  }),
  D.intersect(rawCommon),
)

const rawVisible = pipe(
  D.struct({
    puuid: Puuid.codec,
    riotId: pipe(D.string, D.compose(RiotId.fromStringDecoder)),
  }),
  D.intersect(rawCommon),
)

const rawDecoder = D.union(rawStreamer, rawVisible)

type OmitFromRaw = 'teamId'
type RiotCurrentGameParticipant =
  | Omit<D.TypeOf<typeof rawStreamer>, OmitFromRaw>
  | Omit<D.TypeOf<typeof rawVisible>, OmitFromRaw>

const RiotCurrentGameParticipant = { rawDecoder }

export { RiotCurrentGameParticipant }
