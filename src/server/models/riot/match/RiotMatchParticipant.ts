import { pipe } from 'fp-ts/function'
import * as D from 'io-ts/Decoder'
import type { Except } from 'type-fest'

import { MsDuration } from '../../../../shared/models/MsDuration'
import { TeamId } from '../../../../shared/models/api/activeGame/TeamId'
import { ChampionId } from '../../../../shared/models/api/champion/ChampionId'
import type { ChampionPosition } from '../../../../shared/models/api/champion/ChampionPosition'
import { RuneId } from '../../../../shared/models/api/perk/RuneId'
import { RuneStyleId } from '../../../../shared/models/api/perk/RuneStyleId'
import { Puuid } from '../../../../shared/models/api/summoner/Puuid'
import { SummonerSpellKey } from '../../../../shared/models/api/summonerSpell/SummonerSpellKey'
import { GameName } from '../../../../shared/models/riot/GameName'
import { RiotId } from '../../../../shared/models/riot/RiotId'
import { TagLine } from '../../../../shared/models/riot/TagLine'
import type { Dict } from '../../../../shared/utils/fp'
import { List, Maybe } from '../../../../shared/utils/fp'

import { SummonerId } from '../../summoner/SummonerId'

type Position = (typeof positionValues)[number]

const laneValues = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM'] as const

const positionValues = [...laneValues, 'SUPPORT', 'UTILITY'] as const

const laneDecoder = D.literal(...laneValues, 'NONE')

const positionToPosition: Dict<Position, Maybe<ChampionPosition>> = {
  TOP: Maybe.some('top'),
  JUNGLE: Maybe.some('jun'),
  MIDDLE: Maybe.some('mid'),
  BOTTOM: Maybe.some('bot'),
  SUPPORT: Maybe.some('sup'),
  UTILITY: Maybe.none,
}

const secondsDecoder = pipe(D.number, D.map(MsDuration.seconds))

// ---

type RawRiotMatchParticipant = D.TypeOf<typeof rawDecoder>

const rawDecoder_ = D.struct({
  assists: D.number,
  baronKills: D.number,
  bountyLevel: D.number,
  champExperience: D.number,
  challenges: Maybe.decoder(D.record(D.id<unknown>())),
  champLevel: D.number,
  /**
   * Prior to patch 11.4, on Feb 18th, 2021, this field returned invalid championIds.
   * We recommend determining the champion based on the championName field for matches
   * played prior to patch 11.4.
   */
  championId: D.number,
  championName: ChampionId.codec,
  /**
   * This field is currently only utilized for Kayn's transformations.
   * (Legal values: 0 - None, 1 - Slayer, 2 - Assassin)
   */
  championTransform: D.literal(0, 1, 2),
  consumablesPurchased: D.number,
  damageDealtToBuildings: D.number,
  damageDealtToObjectives: D.number,
  damageDealtToTurrets: D.number,
  damageSelfMitigated: D.number,
  deaths: D.number,
  detectorWardsPlaced: D.number,
  doubleKills: D.number,
  dragonKills: D.number,
  firstBloodAssist: D.boolean,
  firstBloodKill: D.boolean,
  firstTowerAssist: D.boolean,
  firstTowerKill: D.boolean,
  gameEndedInEarlySurrender: D.boolean,
  gameEndedInSurrender: D.boolean,
  goldEarned: D.number,
  goldSpent: D.number,
  /**
   * Both individualPosition and teamPosition are computed by the game server and are
   * different versions of the most likely position played by a player.
   * The individualPosition is the best guess for which position the player actually played
   * in isolation of anything else. The teamPosition is the best guess for which position
   * the player actually played if we add the constraint that each team must have one top
   * player, one jungle, one middle, etc.
   * Generally the recommendation is to use the teamPosition field over the
   * individualPosition field.
   */
  individualPosition: pipe(
    D.literal(...positionValues, 'Invalid'),
    D.map(p => (p === 'Invalid' ? Maybe.none : positionToPosition[p])),
  ),
  inhibitorKills: D.number,
  inhibitorTakedowns: D.number,
  inhibitorsLost: D.number,
  item0: D.number,
  item1: D.number,
  item2: D.number,
  item3: D.number,
  item4: D.number,
  item5: D.number,
  item6: D.number,
  itemsPurchased: D.number,
  killingSprees: D.number,
  kills: D.number,
  lane: pipe(
    laneDecoder,
    D.map(l => (l === 'NONE' ? Maybe.none : Maybe.some(l))),
  ),
  largestCriticalStrike: D.number,
  largestKillingSpree: D.number,
  largestMultiKill: D.number,
  longestTimeSpentLiving: secondsDecoder,
  magicDamageDealt: D.number,
  magicDamageDealtToChampions: D.number,
  magicDamageTaken: D.number,
  missions: Maybe.decoder(D.record(D.number)),
  neutralMinionsKilled: D.number,
  nexusKills: D.number,
  nexusTakedowns: D.number,
  nexusLost: D.number,
  objectivesStolen: D.number,
  objectivesStolenAssists: D.number,
  participantId: D.number,
  pentaKills: D.number,
  perks: D.struct({
    statPerks: D.struct({
      defense: RuneId.codec,
      flex: RuneId.codec,
      offense: RuneId.codec,
    }),
    styles: List.decoder(
      D.struct({
        description: D.literal('primaryStyle', 'subStyle'),
        selections: List.decoder(
          D.struct({
            perk: RuneId.codec,
            var1: D.number,
            var2: D.number,
            var3: D.number,
          }),
        ),
        style: RuneStyleId.codec,
      }),
    ),
  }),
  physicalDamageDealt: D.number,
  physicalDamageDealtToChampions: D.number,
  physicalDamageTaken: D.number,
  profileIcon: D.number,
  puuid: Puuid.codec,
  quadraKills: D.number,
  riotIdGameName: Maybe.decoder(GameName.codec),
  riotIdTagline: TagLine.codec,
  role: D.literal('SOLO', 'DUO', 'CARRY', 'SUPPORT', 'NONE'),
  sightWardsBoughtInGame: D.number,
  spell1Casts: D.number,
  spell2Casts: D.number,
  spell3Casts: D.number,
  spell4Casts: D.number,
  summoner1Casts: D.number,
  summoner1Id: SummonerSpellKey.codec,
  summoner2Casts: D.number,
  summoner2Id: SummonerSpellKey.codec,
  summonerId: SummonerId.codec,
  summonerLevel: D.number,
  teamEarlySurrendered: D.boolean,
  teamId: TeamId.codec,
  /**
   * Both individualPosition and teamPosition are computed by the game server and are
   * different versions of the most likely position played by a player.
   * The individualPosition is the best guess for which position the player actually played
   * in isolation of anything else. The teamPosition is the best guess for which position
   * the player actually played if we add the constraint that each team must have one top
   * player, one jungle, one middle, etc.
   * Generally the recommendation is to use the teamPosition field over the
   * individualPosition field.
   */
  teamPosition: pipe(
    D.literal(...positionValues, ''),
    D.map(p => (p === '' ? Maybe.none : positionToPosition[p])),
  ),
  timeCCingOthers: secondsDecoder,
  timePlayed: secondsDecoder,
  totalDamageDealt: D.number,
  totalDamageDealtToChampions: D.number,
  totalDamageShieldedOnTeammates: D.number,
  totalDamageTaken: D.number,
  totalHeal: D.number,
  totalHealsOnTeammates: D.number,
  totalMinionsKilled: D.number,
  totalTimeCCDealt: secondsDecoder,
  totalTimeSpentDead: secondsDecoder,
  totalUnitsHealed: D.number,
  tripleKills: D.number,
  trueDamageDealt: D.number,
  trueDamageDealtToChampions: D.number,
  trueDamageTaken: D.number,
  turretKills: D.number,
  turretTakedowns: D.number,
  turretsLost: D.number,
  unrealKills: D.number,
  visionScore: D.number,
  visionWardsBoughtInGame: D.number,
  wardsKilled: D.number,
  wardsPlaced: D.number,
  win: D.boolean,
})

const rawDecoder = pipe(
  rawDecoder_,
  D.map(({ riotIdGameName, riotIdTagline, ...participant }) => ({
    ...participant,
    riotId: pipe(
      riotIdGameName,
      Maybe.map(gameName => RiotId(gameName, riotIdTagline)),
    ),
  })),
)

type RiotMatchParticipant = Except<RawRiotMatchParticipant, 'teamId' | 'win'>

const RiotMatchParticipant = { rawDecoder }

export { RiotMatchParticipant }
