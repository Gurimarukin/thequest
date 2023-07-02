import { createContext, useContext } from 'react'

import type { ChallengeId } from '../../shared/models/api/ChallengeId'
import { Lang } from '../../shared/models/api/Lang'
import type { SpellName } from '../../shared/models/api/SpellName'
import type { GameQueue } from '../../shared/models/api/activeGame/GameQueue'
import type {
  ChampionFaction,
  ChampionFactionOrNone,
} from '../../shared/models/api/champion/ChampionFaction'
import type { ChampionKey } from '../../shared/models/api/champion/ChampionKey'
import type { ChampionLevelOrZero } from '../../shared/models/api/champion/ChampionLevel'
import type { ChampionPosition } from '../../shared/models/api/champion/ChampionPosition'
import type { LeagueRank } from '../../shared/models/api/league/LeagueRank'
import type { LeagueTier } from '../../shared/models/api/league/LeagueTier'
import type { SummonerLeaguesView } from '../../shared/models/api/summoner/SummonerLeaguesView'
import type { SummonerSpellKey } from '../../shared/models/api/summonerSpell/SummonerSpellKey'
import type { WikiaStatsBalanceKey } from '../../shared/models/wikia/WikiaStatsBalance'
import type { Dict, Maybe } from '../../shared/utils/fp'

import { frTranslation } from '../locales/fr'
import type { ChampionAramCategory } from '../models/ChampionAramCategory'
import type { ChildrenFC } from '../models/ChildrenFC'

const lang: Lang = Lang.default // TODO: based on browser

export type TranslationContext<K extends null | keyof Translation = null> =
  K extends keyof Translation
    ? GenericTranslationContext<Translation[K]>
    : GenericTranslationContext<Translation>

type GenericTranslationContext<A> = {
  lang: Lang
  t: A
}

const TranslationContext = createContext<TranslationContext | undefined>(undefined)

export const TranslationContextProvider: ChildrenFC = ({ children }) => {
  const value: TranslationContext = {
    lang,
    t: frTranslation,
  }

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>
}

export function useTranslation(): TranslationContext
export function useTranslation<K extends keyof Translation>(key: K): TranslationContext<K>
export function useTranslation<K extends keyof Translation>(key?: K): TranslationContext<K> {
  const context = useContext(TranslationContext)
  if (context === undefined) {
    // eslint-disable-next-line functional/no-throw-statements
    throw Error('useTranslation must be used within a TranslationContextProvider')
  }
  if (key === undefined) return context as TranslationContext<K>
  const { t, ...context_ } = context
  return { ...context_, t: t[key] } as TranslationContext<K>
}

export type Translation = {
  activeGame: {
    bannedBy: (
      summonerName: string,
      championName: Maybe<string>,
      pickTurn: number,
      highlightClassName: string,
    ) => React.ReactNode
    empty: React.ReactNode
    gameStartedAt: (date: Date) => React.ReactNode
    loading: React.ReactNode
    notInGame: React.ReactNode
    theQuestProgression: React.ReactNode
    totalMasteryScore: React.ReactNode
  }
  aram: {
    category: {
      label: Dict<ChampionAramCategory, React.ReactNode>
      description: Dict<ChampionAramCategory, React.ReactNode>
    }
    spell: (spell: SpellName) => React.ReactNode
    statIconAlt: (name: WikiaStatsBalanceKey) => string
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
    fraction: (
      numerator: number,
      denominator: number,
      options?: { withParenthesis: boolean },
    ) => React.ReactNode
    labels: {
      challenge: (id: ChallengeId) => React.ReactNode
      challengeShort: (id: ChallengeId) => React.ReactNode
      faction: Dict<ChampionFaction, React.ReactNode>
      factionOrNone: Dict<ChampionFactionOrNone, React.ReactNode>
      gameQueue: Dict<`${GameQueue}`, React.ReactNode>
      leagueTier: Dict<LeagueTier, React.ReactNode>
      position: Dict<ChampionPosition, React.ReactNode>
      spell: Dict<SpellName, React.ReactNode>
      wikiaStatsBalance: Dict<WikiaStatsBalanceKey, React.ReactNode>
    }
    layout: {
      account: React.ReactNode
      activeGame: React.ReactNode
      championMasteries: React.ReactNode
      game: React.ReactNode
      home: React.ReactNode
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
    }
    masteryIconAlt: (level: ChampionLevelOrZero) => string
    nChampionsFraction: (n: number, total: number) => React.ReactNode
    nResults: (n: number) => React.ReactNode
    number: (n: number, options?: { withParenthesis: boolean }) => React.ReactNode
    numberK: (n: number) => React.ReactNode
    percents: (n: number) => React.ReactNode
    positionIconAlt: (position: ChampionPosition) => string
    randomChampion: React.ReactNode
    runeIconAlt: (name: string) => string
    searchChamion: string
    spellIconAlt: (name: string) => string
    spellKey: (spellKey: SummonerSpellKey) => React.ReactNode
    summonerIconAlt: (name: string) => string
  }
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
  home: {
    aram: React.ReactNode
    factions: React.ReactNode
    globetrotterChallenges: React.ReactNode
    isntEndorsed: React.ReactNode
    specificBalanceChanges: React.ReactNode
    theQuest: React.ReactNode
  }
  masteries: {
    addShard: React.ReactNode
    chestAvailable: React.ReactNode
    chestIconAlt: string
    chestGranted: React.ReactNode
    nShards: (n: number) => React.ReactNode
    nTokens: (n: number) => React.ReactNode
    points: (points: number, total?: number) => React.ReactNode
    pointsSinceLastLevel: (points: number, level: number) => string
    pointsUntilNextLevel: (points: number, level: number) => string
    removeShard: React.ReactNode
    removeNShards: (n: number) => React.ReactNode
    tokenIconAlt: (level: number, options?: { notObtained: boolean }) => string
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
}
