import { DayJs } from '../../shared/models/DayJs'
import type { WikiStatsBalanceKey } from '../../shared/models/WikiStatsBalance'
import type { Skill } from '../../shared/models/api/Skill'
import type {
  ChampionFaction,
  ChampionFactionOrNone,
} from '../../shared/models/api/champion/ChampionFaction'
import type { ChampionPosition } from '../../shared/models/api/champion/ChampionPosition'
import type { LeagueRank } from '../../shared/models/api/league/LeagueRank'
import type { LeagueTier } from '../../shared/models/api/league/LeagueTier'
import { type Dict } from '../../shared/utils/fp'

import { EmojiUpsideDown } from '../imgs/svgs/emojis'
import type { Translation } from '../models/Translation'
import { TranslationUtils } from '../utils/TranslationUtils'

const locale = 'en-GB'

const challengeShort = TranslationUtils.challenge(
  id => `<Challenge ${id}>`,
  f => factionOrNone[f],
)

const factionChallengeName: Dict<ChampionFaction, string> = {
  bandle: '5 under 5’',
  bilgewater: 'All Hands on Deck',
  demacia: 'FOR DEMACIA',
  freljord: 'Ice, Ice, Baby',
  ionia: 'Everybody was Wuju Fighting',
  ixtal: 'Elemental, My Dear Watson',
  noxus: 'Strength Above All',
  piltover: 'Calculated',
  shadowIsles: 'Spooky Scary Skeletons',
  shurima: 'The Sun Disc Never Sets',
  targon: 'Peak Performance',
  void: '(Inhuman Screeching Sounds)',
  zaun: 'Chemtech Comrades',
}

const factionOrNone: Dict<ChampionFactionOrNone, string> = {
  bandle: 'Bandle',
  bilgewater: 'Bilgewater',
  demacia: 'Demacia',
  freljord: 'Freljord',
  ionia: 'Ionia',
  ixtal: 'Ixtal',
  noxus: 'Noxus',
  piltover: 'Piltover',
  shadowIsles: 'Shadow Isles',
  shurima: 'Shurima',
  targon: 'Targon',
  void: 'Void',
  zaun: 'Zaun',
  none: 'No faction',
}

const leagueTier: Dict<LeagueTier, string> = {
  IRON: 'Iron',
  BRONZE: 'Bronze',
  SILVER: 'Silver',
  GOLD: 'Gold',
  PLATINUM: 'Platinum',
  EMERALD: 'Emerald',
  DIAMOND: 'Diamond',
  MASTER: 'Master',
  GRANDMASTER: 'Grand Master',
  CHALLENGER: 'Challenger',
}

const position: Dict<ChampionPosition, string> = {
  top: 'Top',
  jun: 'Jungle',
  mid: 'Midlane',
  bot: 'Botlane',
  sup: 'Support',
}

const rank: Dict<LeagueRank, string> = {
  I: 'I',
  II: 'II',
  III: 'III',
  IV: 'IV',
}

const skill: Dict<Skill, string> = {
  I: 'P',
  Q: 'Q',
  W: 'W',
  E: 'E',
  R: 'R',
}

const wikiStatsBalance: Dict<WikiStatsBalanceKey, string> = {
  dmg_dealt: 'Damage dealt',
  dmg_taken: 'Damage taken',
  healing: 'Healing',
  shielding: 'Shielding',
  ability_haste: 'Ability haste',
  energyregen_mod: 'Energy regeneration',
  total_as: 'Attack speed',
  movement_speed: 'Movement speed',
  tenacity: 'Tenacity',
}

const enGBTranslation: Translation = {
  activeGame: {
    poroIconAlt: 'Poro icon',
    bannedAtTurn: pickTurn => `Banned at turn ${pickTurn}`,
    empty: 'none',
    gameStartedAt: date =>
      `Game started at ${date.toLocaleTimeString(locale)} (${date.toLocaleDateString(locale)})`,
    loading: 'loading',
    notInGame: 'not in game.',
    theQuestProgression: 'The Quest progression',
    totals: (totalMasteryLevel, translatedTotalMasteryPoints, highlightClassName) => (
      <>
        (<span className={highlightClassName}>{nls(totalMasteryLevel)}</span> —{' '}
        <span className={highlightClassName}>{translatedTotalMasteryPoints}</span>)
      </>
    ),
    masteryScoreAndPoints: 'Mastery score — points',
    otpIndex: (otpIndex, highlightClassName) => (
      <>
        OTP index: <span className={highlightClassName}>{nls(otpIndex)}</span>
      </>
    ),
    mainRoles: 'Main roles:',
    currentRole: 'Current role:',
    streamerMode: 'Streamer mode',
  },
  mapChanges: {
    category: {
      label: {
        buffed: 'Buffed champions',
        nerfed: 'Nerfed champions',
        other: 'Others',
        balanced: 'Perfectly balanced champions',
      },
      description: {
        buffed: 'Champions with more buffs than nerfs',
        nerfed: 'Champions with more nerfs than buffs',
        other: (
          <>
            Champions with as many buffs as nerfs (or with skill modifications for which it’s
            difficult to automatically determine whether it’s a buff or a nerf  <EmojiUpsideDown />)
          </>
        ),
        balanced: 'Champions with no balance changes',
      },
    },
    skill: s => `(${skill[s]}) :`,
    statIconAlt: name => `${wikiStatsBalance[name]} stat icon`,
  },
  common: {
    challenge: {
      challenge: 'Challenge',
      iconAlt: id => `${challengeShort(id)} challenge icon`,
      thresholds: 'Thresholds:',
      valueTier: (value, tier, o) =>
        `${value}: ${leagueTier[tier]}${o?.withComma === true ? ',' : ''}`,
    },
    championIconAlt: name => `${name}’s icon`,
    championKey: key => `<Champion ${key}>`,
    cooldownSeconds: (cooldownSeconds, highlightClassName) => (
      <>
        <span className={highlightClassName}>cooldown:</span>{' '}
        {DayJs.Duration.formatSeconds(cooldownSeconds)}
      </>
    ),
    emptyChampionIconAlt: 'Empty champion icon',
    error: 'error',
    errors: {
      addFavoriteError: 'Error while adding favorite',
      fetchUserError: 'Error while fetching user',
      removeFavoriteError: 'Error while removing favorite',
    },
    fraction: (numerator, denominator, o) => {
      const res = `${nls(numerator)} / ${nls(denominator)}`
      return o?.withParenthesis === true ? `(${res})` : res
    },
    labels: {
      challengeShort,
      challenge: TranslationUtils.challenge(
        id => `<Challenge ${id}>`,
        f => factionChallengeName[f],
      ),
      faction: factionOrNone,
      factionOrNone,
      gameQueue: {
        0: 'Custom', // Custom games
        2: '5v5 Blind Pick', // Summoner's Rift — 5v5 Blind Pick games — Deprecated in patch 7.19 in favor of queueId 430"
        4: '5v5 Ranked Solo', // Summoner's Rift — 5v5 Ranked Solo games — Deprecated in favor of queueId 420"
        6: '5v5 Ranked Premade', // Summoner's Rift — 5v5 Ranked Premade games — Game mode deprecated"
        7: 'Co-op vs AI', // Summoner's Rift — Co-op vs AI games — Deprecated in favor of queueId 32 and 33"
        8: '3v3 Normal', // Twisted Treeline — 3v3 Normal games — Deprecated in patch 7.19 in favor of queueId 460"
        9: '3v3 Ranked Flex', // Twisted Treeline — 3v3 Ranked Flex games — Deprecated in patch 7.19 in favor of queueId 470"
        14: '5v5 Draft Pick', // Summoner's Rift — 5v5 Draft Pick games — Deprecated in favor of queueId 400"
        16: '5v5 Dominion Blind Pick', // Crystal Scar — 5v5 Dominion Blind Pick games — Game mode deprecated"
        17: '5v5 Dominion Draft Pick', // Crystal Scar — 5v5 Dominion Draft Pick games — Game mode deprecated"
        25: 'Dominion Co-op vs AI', // Crystal Scar — Dominion Co-op vs AI games — Game mode deprecated"
        31: 'Co-op vs AI Intro Bot', // Summoner's Rift — Co-op vs AI Intro Bot games — Deprecated in patch 7.19 in favor of queueId 830"
        32: 'Co-op vs AI Beginner Bot', // Summoner's Rift — Co-op vs AI Beginner Bot games — Deprecated in patch 7.19 in favor of queueId 840"
        33: 'Co-op vs AI Intermediate Bot', // Summoner's Rift — Co-op vs AI Intermediate Bot games — Deprecated in patch 7.19 in favor of queueId 850"
        41: '3v3 Ranked Team', // Twisted Treeline — 3v3 Ranked Team games — Game mode deprecated"
        42: '5v5 Ranked Team', // Summoner's Rift — 5v5 Ranked Team games — Game mode deprecated"
        52: 'Co-op vs AI', // Twisted Treeline — Co-op vs AI games — Deprecated in patch 7.19 in favor of queueId 800"
        61: '5v5 Team Builder', // Summoner's Rift — 5v5 Team Builder games — Game mode deprecated"
        65: '5v5 ARAM', // Howling Abyss — 5v5 ARAM games — Deprecated in patch 7.19 in favor of queueId 450"
        67: 'ARAM Co-op vs AI', // Howling Abyss — ARAM Co-op vs AI games — Game mode deprecated"
        70: 'One for All', // Summoner's Rift — One for All games — Deprecated in patch 8.6 in favor of queueId 1020"
        72: 'Snowdown Showdown (1c1)', // Howling Abyss — 1v1 Snowdown Showdown games
        73: 'Snowdown Showdown (2c2)', // Howling Abyss — 2v2 Snowdown Showdown games
        75: 'Hexakill', // Summoner's Rift — 6v6 Hexakill games
        76: 'Ultra Rapid Fire', // Summoner's Rift — Ultra Rapid Fire games
        78: 'One For All: Mirror Mode', // Howling Abyss — One For All: Mirror Mode games
        83: 'Coop vs AI Ultra Rapid Fire', // Summoner's Rift — Co-op vs AI Ultra Rapid Fire games
        91: 'Doom Bots Rank 1', // Summoner's Rift — Doom Bots Rank 1 games — Deprecated in patch 7.19 in favor of queueId 950"
        92: 'Doom Bots Rank 2', // Summoner's Rift — Doom Bots Rank 2 games — Deprecated in patch 7.19 in favor of queueId 950"
        93: 'Doom Bots Rank 5', // Summoner's Rift — Doom Bots Rank 5 games — Deprecated in patch 7.19 in favor of queueId 950"
        96: 'Ascension', // Crystal Scar — Ascension games — Deprecated in patch 7.19 in favor of queueId 910"
        98: 'Hexakill (Twisted Treeline)', // Twisted Treeline — 6v6 Hexakill games
        100: 'ARAM (Butcher’s Bridge)', // Butcher's Bridge — 5v5 ARAM games
        300: 'Legend of the Poro King', // Howling Abyss — Legend of the Poro King games — Deprecated in patch 7.19 in favor of queueId 920"
        310: 'Nemesis', // Summoner's Rift — Nemesis games
        313: 'Black Market Brawlers', // Summoner's Rift — Black Market Brawlers games
        315: 'Nexus Siege', // Summoner's Rift — Nexus Siege games — Deprecated in patch 7.19 in favor of queueId 940"
        317: 'Definitely Not Dominion', // Crystal Scar — Definitely Not Dominion games
        318: 'ARURF', // Summoner's Rift — ARURF games — Deprecated in patch 7.19 in favor of queueId 900"
        325: 'All Random', // Summoner's Rift — All Random games
        400: 'Draft Normal', // Summoner's Rift — 5v5 Draft Pick games
        410: '5v5 Ranked Dynamic', // Summoner's Rift — 5v5 Ranked Dynamic games — Game mode deprecated in patch 6.22"
        420: 'Ranked Solo/Duo', // Summoner's Rift — 5v5 Ranked Solo games
        430: 'Blind Normal', // Summoner's Rift — 5v5 Blind Pick games
        440: 'Ranked FLEXXX', // Summoner's Rift — 5v5 Ranked Flex games
        450: 'ARAM', // Howling Abyss — 5v5 ARAM games
        460: '3v3 Blind Pick', // Twisted Treeline — 3v3 Blind Pick games — Deprecated in patch 9.23"
        470: '3v3 Ranked Flex', // Twisted Treeline — 3v3 Ranked Flex games — Deprecated in patch 9.23"
        480: 'Swiftplay', // Swiftplay
        490: 'Quickplay', // Summoner's Rift — Normal (Quickplay)
        600: 'Blood Hunt Assassin', // Summoner's Rift — Blood Hunt Assassin games
        610: 'Dark Star: Singularity', // Cosmic Ruins — Dark Star: Singularity games
        700: 'Clash', // Summoner's Rift — Summoner's Rift Clash games
        720: 'Clash (ARAM)', // Howling Abyss — ARAM Clash games
        800: 'Co-op vs. AI Intermediate Bot', // Twisted Treeline — Co-op vs. AI Intermediate Bot games — Deprecated in patch 9.23"
        810: 'Co-op vs. AI Intro Bot games', // Twisted Treeline — Co-op vs. AI Intro Bot games — Deprecated in patch 9.23"
        820: 'Coop vs AI Begginer (Twisted Treeline)', // Twisted Treeline — Co-op vs. AI Beginner Bot games
        830: 'Coop vs AI Intro', // Summoner's Rift — Co-op vs. AI Intro Bot games
        840: 'Coop vs AI Begginer', // Summoner's Rift — Co-op vs. AI Beginner Bot games
        850: 'Coop vs AI Intermediate', // Summoner's Rift — Co-op vs. AI Intermediate Bot games
        870: 'Coop vs AI Intro', // Summoner's Rift — Co-op vs. AI Intro Bot games
        880: 'Coop vs AI Begginer', // Summoner's Rift — Co-op vs. AI Beginner Bot games
        890: 'Coop vs AI Intermediate', // Summoner's Rift — Co-op vs. AI Intermediate Bot games
        900: 'ARURF', // Summoner's Rift — ARURF games
        910: 'Ascension', // Crystal Scar — Ascension games
        920: 'Legend of the Poro King', // Howling Abyss — Legend of the Poro King games
        940: 'Nexus Siege', // Summoner's Rift — Nexus Siege games
        950: 'Doom Bots (voting)', // Summoner's Rift — Doom Bots Voting games
        960: 'Doom Bots', // Summoner's Rift — Doom Bots Standard games
        980: 'Star Guardian Invasion Normal', // Valoran City Park — Star Guardian Invasion: Normal games
        990: 'Star Guardian Invasion Onslaught', // Valoran City Park — Star Guardian Invasion: Onslaught games
        1000: 'PROJECT: Hunters', // Overcharge — PROJECT: Hunters games
        1010: 'ARURF (Snow)', // Summoner's Rift — Snow ARURF games
        1020: 'One For All', // Summoner's Rift — One for All games
        1030: 'Odyssée Extraction Intro', // Crash Site — Odyssey Extraction: Intro games
        1040: 'Odyssée Extraction Cadet', // Crash Site — Odyssey Extraction: Cadet games
        1050: 'Odyssée Extraction Crewmember', // Crash Site — Odyssey Extraction: Crewmember games
        1060: 'Odyssée Extraction Captain', // Crash Site — Odyssey Extraction: Captain games
        1070: 'Odyssée Extraction Onslaught', // Crash Site — Odyssey Extraction: Onslaught games
        1090: 'TFT', // Convergence — Teamfight Tactics games
        1100: 'TFT Ranked', // Convergence — Ranked Teamfight Tactics games
        1110: 'TFT Tutorial', // Convergence — Teamfight Tactics Tutorial games
        1111: 'TFT test', // Convergence — Teamfight Tactics test games
        1200: 'Nexus Blitz', // Nexus Blitz — Nexus Blitz games — Deprecated in patch 9.2"
        1210: "TFT Choncc's Treasure", // Convergence — Teamfight Tactics Choncc's Treasure Mode
        1300: 'Nexus Blitz', // Nexus Blitz — Nexus Blitz games
        1400: 'Ultimate Spellbook', // Summoner's Rift — Ultimate Spellbook games
        1700: 'Arena', // Rings of Wrath — Arena
        1710: 'Arena', // Rings of Wrath — Arena
        1810: 'Swarm', // Swarm — Swarm Mode Games
        1820: 'Swarm', // Swarm Mode Games — Swarm
        1830: 'Swarm', // Swarm Mode Games — Swarm
        1840: 'Swarm', // Swarm Mode Games — Swarm
        1900: 'Pick URF', // Summoner's Rift — Pick URF games
        2000: 'Tutorial 1', // Summoner's Rift — Tutorial 1
        2010: 'Tutorial 2', // Summoner's Rift — Tutorial 2
        2020: 'Tutorial 3', // Summoner's Rift — Tutorial 3
        2300: 'Brawl', // The Bandlewood — Brawl map
        4210: 'Doom Bots (?)', // Summoner's Rift — Doom Bots
        4220: 'Doom Bots Hard',
      },
      leagueTier,
      position,
      skill,
      wikiStatsBalance,
    },
    layout: {
      account: 'Account',
      activeGame: 'Active game',
      championMasteries: 'Champion’s masteries',
      game: 'Game',
      home: 'Home',
      aramSpecificBalanceChanges: 'ARAM specific balance changes',
      urfSpecificBalanceChanges: 'URF specific balance changes',
      globetrotterChallenges: '“Globetrotter” challenges ',
      timers: 'Summoner spells timers',
      login: 'Login',
      logout: 'Logout',
      profile: 'Profile',
      searchSummoner: 'Search summoner',
      register: 'Register',
      yuumiHomeAlt: 'Home icon (Yuumi)',
    },
    league: {
      label: {
        soloDuo: 'Ranked Solo/Duo',
        flex: 'Ranked FLEXXX',
      },
      leaguePoints: n => `${n} LP`,
      losses: n => (n < 2 ? 'loss' : 'losses'),
      wins: pluralUnit('win'),
      serie: 'Serie:',
      tierRank: (tier, rank_) =>
        `${leagueTier[tier]}${rank_ !== undefined ? ` ${rank[rank_]}` : ''}`,
      tierRankAlt: (tier, rank_) =>
        `${leagueTier[tier]}${rank_ !== undefined ? ` ${rank[rank_]}` : ''}`,
      unranked: 'Unranked',
      unrankedIconAlt: 'Unranked icon',
      previousSplit: 'Previous split:',
    },
    masteryIconAlt: level => `Level ${level} icon`,
    nChampionsFraction: (n, total) => `${plural('champion')(n)} / ${nls(total)}`,
    nResults: plural('result'),
    notFound: 'not found.',
    number: (n, o) => (o?.withParenthesis === true ? `(${nls(n)})` : nls(n)),
    numberK: n => `${nls(n)}k`,
    numberM: n => `${nls(n)}M`,
    percents: n => `${nls(n)}%`,
    randomChampion: 'Random champion',
    runeIconAlt: name => `${name} run icon`,
    searchChamion: 'Search champion',
    spellIconAlt: name => `${name} spell icon`,
    spellKey: key => `<Spell ${key}>`,
    level: (level, highlightClassName) => (
      <>
        level <span className={highlightClassName}>{nls(level)}</span>
      </>
    ),
    summonerLevel: 'Summoner level',
    oldSummonerName: 'Old summoner name:',
    summonerIconAlt: name => `${name}’ icon`,
    form: {
      alreadyAnAccount: 'Already an account?',
      confirmPassword: 'Confirm password:',
      login: 'Login',
      loginWithDiscord: discordLogo => <>Login with {discordLogo}</>,
      noAccount: 'No account?',
      or: 'or',
      password: 'Password:',
      passwordsShouldBeIdentical: 'Passwords should be identical',
      register: 'Register',
      userName: 'Username:',
    },
  },
  home: {
    isntEndorsed:
      'The Quest isn’t endorsed by Riot Games and doesn’t reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.',
    theQuest: 'The Quest.',
  },
  masteries: {
    addShard: 'Add shard',
    filters: {
      all: 'all',
      level: level => `Level ${level}${level === 10 ? '+' : ''}`,
      order: {
        desc: 'Sort descending',
        asc: 'Sort ascending',
      },
      nineAndLess: '9 and less',
      tenAndMore: '10+',
      sort: {
        level: 'Sort par level > tokens > points',
        percents: 'Sort by percents > points',
        points: 'Sort by points',
        name: 'Sort by name',
      },
      sortShort: {
        level: 'lvl',
        percents: '%',
        points: 'pts',
        name: 'abc',
      },
      view: {
        aram: 'ARAM view',
        compact: 'Compact view',
        factions: 'Factions view',
        histogram: 'Histogram view',
        urf: 'URF view',
      },
      viewShort: {
        aram: 'ARAM',
        compact: 'Compact',
        factions: 'Factions',
        histogram: 'Histogram',
        urf: 'URF',
      },
    },
    modal: {
      confirm: 'Confirm',
      masteryChange: (from, to) => `Update from mastery ${nls(from)} to ${nls(to)}`,
      nChangesDetected: n => (
        <>
          Level {pluralUnit('change')(n)} detected since last shards update.
          <br />
          Maybe you’ve spent some (shards)?
        </>
      ),
      no: 'No',
      noForAll: 'No for all',
      removeNShards: n => `remove ${plural('shard')(n)}`,
      yes: 'Yes',
      yesForAll: 'Yes for all',
    },
    nShards: plural('shard'),
    nMarksOfMastery: (earned, total) => `${plural('token')(earned)} / ${nls(total)}`,
    points: (points, total, highlightClassName) => (
      <>
        <span className={highlightClassName}>{nls(points)}</span>{' '}
        {total !== undefined ? (
          <>
            / <span className={highlightClassName}>{nls(total)}</span> {pluralUnit('point')(total)}
          </>
        ) : (
          pluralUnit('point')(points)
        )}
      </>
    ),
    unknownPoints: highlightClassName => (
      <>
        <span className={highlightClassName}>???</span> points
      </>
    ),
    unknownPercents: `??%`,
    pointsSinceLastLevel: (points, level) =>
      points < 0
        ? `${plural('point')(Math.abs(points))} until level ${nls(level)}`
        : `${plural('point')(points)} since level ${nls(level)}`,
    pointsUntilNextLevel: (points, level) =>
      points < 0
        ? `level ${nls(level)} exceeded by ${plural('point')(Math.abs(points))}`
        : `${plural('point')(points)} until level ${nls(level)}`,
    removeShard: 'Remove shard',
    updateShardsSucces: 'Shards updated',
    updateShardsError: 'Error while update shards',
  },
  notFound: {
    home: 'Home',
    thisPageDoesntExist: 'This page doesn’t exist.',
  },
  register: {
    accessRecentSearches: recentSearches =>
      `View ${nls(recentSearches)} most recent searches (browser’s local storage)`,
    accessSummonerDetails: 'Search for summoner’s details',
    addSummonerToFavorites: 'Adding favorite summoners',
    customiseChampionPositions: 'Customize the champions associated with a positon (one day)',
    discordHallOfFameRanking: (
      <>
        Ranking in the Hall of Fame on the Captain’s Discord server
        <br />
        <i>(Ask to be added)</i>:
      </>
    ),
    discordServer: 'Discord server',
    discordServerIconAlt: name => `${name} server’s icon`,
    join: 'Join',
    withAccount: 'With account',
    withoutAccount: 'Without account',
  },
  summoner: {
    masteriesCache: {
      lastUpdate: insertedAt => `Masteries last update at ${insertedAt.toLocaleTimeString(locale)}`,
      duration: minutes =>
        `(cache duration: ${minutes.toLocaleString(locale, {
          maximumFractionDigits: 2,
        })} ${pluralUnit('minute')(minutes)})`,
    },
    masteryScore: 'Mastery score:',
    masteryPoints: 'Mastery points:',
    otpIndex: 'OTP index:',
    otpIndexExplanation: '(number of champions cumulating half the total number of mastery points)',
    masteriesExplanation: (
      <>
        <li>Mastery level 10 or more = 100%</li>
        <li>
          It takes 75,600 points to reach level 10 (counts for half the percentage calculation)
        </li>
        <li>
          It takes 7 Marks of Mastery to reach level 10 (counts for the other half of the
          calculation)
        </li>
      </>
    ),
    percentsProgression: (percents, highlightClassName) => (
      <>
        Progression: <span className={highlightClassName}>{nls(percents)} %</span>
      </>
    ),
  },
  router: {
    theQuest: 'The Quest',
    game: 'game',
    aram: 'ARAM',
    urf: 'URF',
    factions: 'Factions',
    timers: 'Timers',
    login: 'Login',
    register: 'Register',
    notFound: 'Page not found',
  },
}

export default enGBTranslation

/**
 * n.toLocaleString(locale)
 */
function nls(n: number): string {
  return n.toLocaleString(locale)
}

function plural(unit: string) {
  return (n: number): string => `${nls(n)} ${pluralUnit(unit)(n)}`
}

function pluralUnit(unit: string) {
  return (n: number): string => `${unit}${n < 2 ? '' : 's'}`
}
