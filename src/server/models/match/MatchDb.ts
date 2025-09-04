import type { Codec } from 'io-ts/Codec'
import * as C from 'io-ts/Codec'
import * as D from 'io-ts/Decoder'
import * as E from 'io-ts/Encoder'

import type { DayJs } from '../../../shared/models/DayJs'
import { MsDuration } from '../../../shared/models/MsDuration'
import { GameId } from '../../../shared/models/api/GameId'
import { Platform } from '../../../shared/models/api/Platform'
import { TeamId } from '../../../shared/models/api/activeGame/TeamId'
import { ChampionId } from '../../../shared/models/api/champion/ChampionId'
import { ChampionKey } from '../../../shared/models/api/champion/ChampionKey'
import { ChampionPosition } from '../../../shared/models/api/champion/ChampionPosition'
import { RuneId } from '../../../shared/models/api/perk/RuneId'
import { RuneStyleId } from '../../../shared/models/api/perk/RuneStyleId'
import { Puuid } from '../../../shared/models/api/summoner/Puuid'
import { SummonerSpellKey } from '../../../shared/models/api/summonerSpell/SummonerSpellKey'
import { RiotId } from '../../../shared/models/riot/RiotId'
import { SummonerName } from '../../../shared/models/riot/SummonerName'
import { type Dict, List, Maybe } from '../../../shared/utils/fp'

import { GameType } from '../riot/GameType'

const objectiveCodec = C.struct({
  first: C.boolean,
  kills: C.number,
})

export type MatchParticipantDb = C.TypeOf<typeof participantCodec>

const participantCodec = C.struct({
  assists: C.number,
  baronKills: C.number,
  bountyLevel: C.number,
  champExperience: C.number,
  challenges: Maybe.codec(C.record(C.make(D.id<unknown>(), E.id<unknown>()))),
  champLevel: C.number,
  /**
   * Prior to patch 11.4, on Feb 18th, 2021, this field returned invalid championIds.
   * We recommend determining the champion based on the championName field for matches
   * played prior to patch 11.4.
   */
  championId: C.number,
  championName: ChampionId.codec,
  /**
   * This field is currently only utilized for Kayn's transformations.
   * (Legal values: 0 - None, 1 - Slayer, 2 - Assassin)
   */
  championTransform: C.literal(0, 1, 2),
  consumablesPurchased: C.number,
  damageDealtToBuildings: C.number,
  damageDealtToObjectives: C.number,
  damageDealtToTurrets: C.number,
  damageSelfMitigated: C.number,
  deaths: C.number,
  detectorWardsPlaced: C.number,
  doubleKills: C.number,
  dragonKills: C.number,
  firstBloodAssist: C.boolean,
  firstBloodKill: C.boolean,
  firstTowerAssist: C.boolean,
  firstTowerKill: C.boolean,
  gameEndedInEarlySurrender: C.boolean,
  gameEndedInSurrender: C.boolean,
  goldEarned: C.number,
  goldSpent: C.number,
  individualPosition: Maybe.codec(ChampionPosition.codec),
  inhibitorKills: C.number,
  inhibitorTakedowns: C.number,
  inhibitorsLost: C.number,
  item0: C.number,
  item1: C.number,
  item2: C.number,
  item3: C.number,
  item4: C.number,
  item5: C.number,
  item6: C.number,
  itemsPurchased: C.number,
  killingSprees: C.number,
  kills: C.number,
  lane: Maybe.codec(C.literal('TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM')),
  largestCriticalStrike: C.number,
  largestKillingSpree: C.number,
  largestMultiKill: C.number,
  longestTimeSpentLiving: MsDuration.codec,
  magicDamageDealt: C.number,
  magicDamageDealtToChampions: C.number,
  magicDamageTaken: C.number,
  missions: Maybe.codec(C.record(C.number)),
  neutralMinionsKilled: C.number,
  nexusKills: C.number,
  nexusTakedowns: C.number,
  nexusLost: C.number,
  objectivesStolen: C.number,
  objectivesStolenAssists: C.number,
  participantId: C.number,
  pentaKills: C.number,
  perks: C.struct({
    statPerks: C.struct({
      defense: RuneId.codec,
      flex: RuneId.codec,
      offense: RuneId.codec,
    }),
    styles: List.codec(
      C.struct({
        description: C.literal('primaryStyle', 'subStyle'),
        selections: List.codec(
          C.struct({
            perk: RuneId.codec,
            var1: C.number,
            var2: C.number,
            var3: C.number,
          }),
        ),
        style: RuneStyleId.codec,
      }),
    ),
  }),
  physicalDamageDealt: C.number,
  physicalDamageDealtToChampions: C.number,
  physicalDamageTaken: C.number,
  profileIcon: C.number,
  puuid: Puuid.codec,
  quadraKills: C.number,
  riotId: Maybe.codec(RiotId.fromStringCodec),
  role: C.literal('SOLO', 'DUO', 'CARRY', 'SUPPORT', 'NONE'),
  sightWardsBoughtInGame: C.number,
  spell1Casts: C.number,
  spell2Casts: C.number,
  spell3Casts: C.number,
  spell4Casts: C.number,
  summoner1Casts: C.number,
  summoner1Id: SummonerSpellKey.codec,
  summoner2Casts: C.number,
  summoner2Id: SummonerSpellKey.codec,
  // summonerId: SummonerId.codec,
  summonerLevel: C.number,
  /**
   * Exists as Maybe for retrocompatibility
   */
  summonerName: Maybe.codec(SummonerName.codec),
  teamEarlySurrendered: C.boolean,
  teamPosition: Maybe.codec(ChampionPosition.codec),
  timeCCingOthers: MsDuration.codec,
  timePlayed: MsDuration.codec,
  totalDamageDealt: C.number,
  totalDamageDealtToChampions: C.number,
  totalDamageShieldedOnTeammates: C.number,
  totalDamageTaken: C.number,
  totalHeal: C.number,
  totalHealsOnTeammates: C.number,
  totalMinionsKilled: C.number,
  totalTimeCCDealt: MsDuration.codec,
  totalTimeSpentDead: MsDuration.codec,
  totalUnitsHealed: C.number,
  tripleKills: C.number,
  trueDamageDealt: C.number,
  trueDamageDealtToChampions: C.number,
  trueDamageTaken: C.number,
  turretKills: C.number,
  turretTakedowns: C.number,
  turretsLost: C.number,
  unrealKills: C.number,
  visionScore: C.number,
  visionWardsBoughtInGame: C.number,
  wardsKilled: C.number,
  wardsPlaced: C.number,
})

export type MatchTeamDb = C.TypeOf<typeof teamCodec>

const teamCodec = C.struct({
  bans: List.codec(
    C.struct({
      championId: Maybe.codec(ChampionKey.codec),
      pickTurn: C.number,
    }),
  ),
  objectives: C.struct({
    baron: objectiveCodec,
    champion: objectiveCodec,
    dragon: objectiveCodec,
    inhibitor: objectiveCodec,
    riftHerald: objectiveCodec,
    tower: objectiveCodec,
  }),
  participants: List.codec(participantCodec),
})

const teamProperties: Dict<`${TeamId}`, typeof teamCodec> = {
  100: teamCodec,
  200: teamCodec,
}

type MatchDb = C.TypeOf<ReturnType<typeof codec>>
type MatchDbOutput = C.OutputOf<ReturnType<typeof codec>>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function codec<O>(dayjsCodec: Codec<unknown, O, DayJs>) {
  return C.struct({
    platform: Platform.codec,
    id: GameId.codec,
    dataVersion: C.string, // '2'
    gameCreation: dayjsCodec,
    gameDuration: MsDuration.codec,
    gameEndTimestamp: dayjsCodec,
    /** GameMode */
    gameMode: C.string,
    gameName: C.string,
    gameStartTimestamp: dayjsCodec,
    gameType: GameType.codec,
    gameVersion: C.string,
    /** MapId */
    mapId: C.number,
    /** GameQueue */
    queueId: C.number,
    teams: C.partial(teamProperties),
    win: TeamId.codec,
  })
}

const MatchDb = { codec }

export { MatchDb, MatchDbOutput }
