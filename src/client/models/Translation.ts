import type { WikiStatsBalanceKey } from '../../shared/models/WikiStatsBalance'
import type { ChallengeId } from '../../shared/models/api/ChallengeId'
import type { SpellName } from '../../shared/models/api/SpellName'
import type { GameQueue } from '../../shared/models/api/activeGame/GameQueue'
import type {
  ChampionFaction,
  ChampionFactionOrNone,
} from '../../shared/models/api/champion/ChampionFaction'
import type { ChampionKey } from '../../shared/models/api/champion/ChampionKey'
import type { ChampionLevel } from '../../shared/models/api/champion/ChampionLevel'
import type { ChampionPosition } from '../../shared/models/api/champion/ChampionPosition'
import type { LeagueRank } from '../../shared/models/api/league/LeagueRank'
import type { LeagueTier } from '../../shared/models/api/league/LeagueTier'
import type { SummonerLeaguesView } from '../../shared/models/api/summoner/SummonerLeaguesView'
import type { SummonerSpellKey } from '../../shared/models/api/summonerSpell/SummonerSpellKey'
import type { Dict } from '../../shared/utils/fp'

import type { ChampionAramCategory } from './ChampionAramCategory'
import type { MasteriesQueryOrder } from './masteriesQuery/MasteriesQueryOrder'
import type { MasteriesQuerySort } from './masteriesQuery/MasteriesQuerySort'
import type { MasteriesQueryView } from './masteriesQuery/MasteriesQueryView'

export type Translation = {
  activeGame: {
    poroIconAlt: string
    bannedAtTurn: (pickTurn: number) => React.ReactNode
    empty: React.ReactNode
    gameStartedAt: (date: Date) => React.ReactNode
    loading: React.ReactNode
    notInGame: React.ReactNode
    theQuestProgression: React.ReactNode
    totals: (
      totalMasteryLevel: number,
      translatedTotalMasteryPoints: React.ReactNode,
      highlightClassName?: string,
    ) => React.ReactNode
    masteryScoreAndPoints: React.ReactNode
    otpIndex: (otpIndex: number, highlightClassName?: string) => React.ReactNode
    mainRoles: React.ReactNode
    currentRole: React.ReactNode
  }
  aram: {
    category: {
      label: Dict<ChampionAramCategory, React.ReactNode>
      description: Dict<ChampionAramCategory, React.ReactNode>
    }
    spell: (spell: SpellName) => React.ReactNode
    statIconAlt: (name: WikiStatsBalanceKey) => string
  }
  common: {
    challenge: {
      challenge: React.ReactNode
      iconAlt: (id: ChallengeId) => string
      thresholds: React.ReactNode
      valueTier: (
        value: number,
        tier: LeagueTier,
        options?: { withComma: boolean },
      ) => React.ReactNode
    }
    championIconAlt: (name: string) => string
    championKey: (key: ChampionKey) => string
    cooldownSeconds: (cooldown: number, highlightClassName: string) => React.ReactNode
    emptyChampionIconAlt: string
    error: React.ReactNode
    errors: {
      addFavoriteError: React.ReactNode
      fetchUserError: React.ReactNode
      removeFavoriteError: React.ReactNode
    }
    fraction: (
      numerator: number,
      denominator: number,
      options?: { withParenthesis: boolean },
    ) => React.ReactNode
    labels: {
      challenge: (id: ChallengeId) => React.ReactNode
      challengeShort: (id: ChallengeId) => React.ReactNode
      faction: Dict<ChampionFaction, string>
      factionOrNone: Dict<ChampionFactionOrNone, React.ReactNode>
      gameQueue: Dict<`${GameQueue}`, React.ReactNode>
      leagueTier: Dict<LeagueTier, React.ReactNode>
      position: Dict<ChampionPosition, React.ReactNode>
      spell: Dict<SpellName, React.ReactNode>
      wikiStatsBalance: Dict<WikiStatsBalanceKey, React.ReactNode>
    }
    layout: {
      account: React.ReactNode
      activeGame: React.ReactNode
      championMasteries: React.ReactNode
      game: React.ReactNode
      home: React.ReactNode
      aramSpecificBalanceChanges: React.ReactNode
      globetrotterChallenges: React.ReactNode
      login: React.ReactNode
      logout: React.ReactNode
      profile: React.ReactNode
      searchSummoner: string
      register: React.ReactNode
      yuumiIconAlt: string
    }
    league: {
      label: Dict<keyof SummonerLeaguesView, React.ReactNode>
      leaguePoints: (n: number) => React.ReactNode
      losses: (n: number) => React.ReactNode
      wins: (n: number) => React.ReactNode
      serie: React.ReactNode
      tierRank: (tier: LeagueTier, rank?: LeagueRank) => React.ReactNode
      tierRankAlt: (tier: LeagueTier, rank?: LeagueRank) => string
      unranked: React.ReactNode
      unrankedIconAlt: string
      previousSplit: React.ReactNode
    }
    masteryIconAlt: (level: ChampionLevel) => string
    nChampionsFraction: (n: number, total: number) => React.ReactNode
    nResults: (n: number) => React.ReactNode
    notFound: React.ReactNode
    number: (n: number, options?: { withParenthesis: boolean }) => React.ReactNode
    numberK: (n: number) => React.ReactNode
    numberM: (n: number) => React.ReactNode
    percents: (n: number) => React.ReactNode
    randomChampion: React.ReactNode
    runeIconAlt: (name: string) => string
    searchChamion: string
    spellIconAlt: (name: string) => string
    spellKey: (spellKey: SummonerSpellKey) => React.ReactNode
    level: (level: number, highlightClassName?: string) => React.ReactNode
    summonerLevel: React.ReactNode
    oldSummonerName: React.ReactNode
    summonerIconAlt: (name: string) => string
    form: {
      alreadyAnAccount: React.ReactNode
      confirmPassword: React.ReactNode
      login: React.ReactNode
      loginWithDiscord: (discordLogo: React.ReactNode) => React.ReactNode
      noAccount: React.ReactNode
      or: React.ReactNode
      password: React.ReactNode
      passwordsShouldBeIdentical: string
      register: React.ReactNode
      registerWithDiscord: (discordLogo: React.ReactNode) => React.ReactNode
      userName: React.ReactNode
    }
  }
  home: {
    isntEndorsed: React.ReactNode
    theQuest: React.ReactNode
  }
  masteries: {
    addShard: React.ReactNode
    filters: {
      all: React.ReactNode
      level: (level: ChampionLevel) => React.ReactNode
      order: Dict<MasteriesQueryOrder, React.ReactNode>
      nineAndLess: React.ReactNode
      tenAndMore: React.ReactNode
      sort: {
        [K in MasteriesQuerySort]: React.ReactNode
      }
      sortShort: Dict<MasteriesQuerySort, React.ReactNode>
      view: Dict<MasteriesQueryView, React.ReactNode>
      viewShort: Dict<MasteriesQueryView, React.ReactNode>
    }
    modal: {
      confirm: React.ReactNode
      masteryChange: (from: number, to: number) => React.ReactNode
      nChangesDetected: (n: number) => React.ReactNode
      no: React.ReactNode
      noForAll: React.ReactNode
      removeNShards: (n: number) => React.ReactNode
      yes: React.ReactNode
      yesForAll: React.ReactNode
    }
    nShards: (n: number) => React.ReactNode
    nMarksOfMastery: (earned: number, total: number) => React.ReactNode
    points: (points: number, total?: number, highlightClassName?: string) => React.ReactNode
    pointsSinceLastLevel: (points: number, level: number) => string
    pointsUntilNextLevel: (points: number, level: number) => string
    removeShard: React.ReactNode
    updateShardsSucces: React.ReactNode
    updateShardsError: React.ReactNode
  }
  notFound: {
    home: React.ReactNode
    thisPageDoesntExist: React.ReactNode
  }
  register: {
    accessRecentSearches: (recentSearches: number) => React.ReactNode
    accessSummonerDetails: React.ReactNode
    addSummonerToFavorites: React.ReactNode
    customiseChampionPositions: React.ReactNode
    discordHallOfFameRanking: React.ReactNode
    discordServer: React.ReactNode
    discordServerIconAlt: (name: string) => string
    join: React.ReactNode
    keepTrackOfShards: React.ReactNode
    quickSummonerAccess: React.ReactNode
    registrationExplanation: React.ReactNode
    withAccountLinked: React.ReactNode
    withAccountNotLinked: React.ReactNode
    withoutAccount: React.ReactNode
  }
  summoner: {
    masteriesCache: {
      lastUpdate: (insertedAt: Date) => React.ReactNode
      duration: (minutes: number) => React.ReactNode
    }
    masteriesExplanation: React.ReactNode
    masteryScore: React.ReactNode
    masteryPoints: React.ReactNode
    otpIndex: React.ReactNode
    otpIndexExplanation: React.ReactNode
    percentsProgression: (percents: number, highlightClassName: string) => React.ReactNode
  }
  router: {
    theQuest: string
    game: string
    aram: string
    factions: string
    login: string
    register: string
    notFound: string
  }
}
