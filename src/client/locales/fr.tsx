import { pipe } from 'fp-ts/function'

import type { SpellName } from '../../shared/models/api/SpellName'
import type {
  ChampionFaction,
  ChampionFactionOrNone,
} from '../../shared/models/api/champion/ChampionFaction'
import type { ChampionPosition } from '../../shared/models/api/champion/ChampionPosition'
import type { LeagueRank } from '../../shared/models/api/league/LeagueRank'
import type { LeagueTier } from '../../shared/models/api/league/LeagueTier'
import type { WikiaStatsBalanceKey } from '../../shared/models/wikia/WikiaStatsBalance'
import { type Dict, Maybe } from '../../shared/utils/fp'

import type { Translation } from '../contexts/TranslationContext'
import { TranslationUtils } from '../utils/TranslationUtils'

const locale = 'fr-FR'

const challengeShort = TranslationUtils.challenge(
  id => `<Challenge ${id}>`,
  f => factionOrNone[f],
)

const factionChallengeName: Dict<ChampionFaction, string> = {
  bandle: '5 sur 5',
  bilgewater: 'Naufrageurs',
  demacia: 'POUR DEMACIA',
  freljord: 'Premiers de la glace',
  ionia: 'Tendez l’autre Wuju',
  ixtal: 'Terrible jungle',
  noxus: 'La force avant tout',
  piltover: 'Innovateurs',
  shadowIsles: 'Terreurs des îles',
  shurima: 'Artistes shurimartiaux',
  targon: 'Maîtres de la montagne',
  void: '(Cris inhumains)',
  zaun: 'Troupe techno-chimique',
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
  shadowIsles: 'Îles Obscures',
  shurima: 'Shurima',
  targon: 'Targon',
  void: 'Néant',
  zaun: 'Zaun',
  none: 'Sans faction',
}

const leagueTier: Dict<LeagueTier, string> = {
  IRON: 'Fer',
  BRONZE: 'Bronze',
  SILVER: 'Argent',
  GOLD: 'Or',
  PLATINUM: 'Platine',
  DIAMOND: 'Diamant',
  MASTER: 'Maître',
  GRANDMASTER: 'Grand Maître',
  CHALLENGER: 'Challenger',
}

const position: Dict<ChampionPosition, string> = {
  top: 'Haut',
  jun: 'Jungle',
  mid: 'Milieu',
  bot: 'Bas',
  sup: 'Support',
}

const rank: Dict<LeagueRank, string> = {
  I: 'I',
  II: 'II',
  III: 'III',
  IV: 'IV',
}

const spell: Dict<SpellName, string> = {
  I: 'P',
  Q: 'Q',
  W: 'W',
  E: 'E',
  R: 'R',
}

const wikiaStatsBalance: Dict<WikiaStatsBalanceKey, string> = {
  dmg_dealt: 'Dégâts infligés',
  dmg_taken: 'Dégâts subis',
  healing: 'Efficacité des soins',
  shielding: 'Efficacité des boucliers',
  ability_haste: 'Accélération de compétences',
  energy_regen: 'Regénération d’énergie',
  attack_speed: 'Vitesse d’attaque',
  movement_speed: 'Vitesse de déplacement',
  tenacity: 'Tenacité',
}

export const frTranslation: Translation = {
  activeGame: {
    bannedBy: (summonerName, championName, pickTurn, highlightClassName) => (
      <>
        <span>banni par</span>
        <span className={highlightClassName}>
          {summonerName}
          {pipe(
            championName,
            Maybe.fold(
              () => null,
              name => ` (${name})`,
            ),
          )}
        </span>
        <span>au tour {pickTurn}</span>
      </>
    ),
    empty: 'Aucun.',
    gameStartedAt: date =>
      `Partie commencée à ${date.toLocaleTimeString(locale)} (${date.toLocaleDateString(locale)})`,
    loading: 'chargement',
    notInGame: 'pas en partie.',
    theQuestProgression: 'Progression de La Quête',
    totalMasteryScore: 'Score total de maîtrise',
  },
  aram: {
    category: {
      label: {
        buffed: 'Champions buffés',
        nerfed: 'Champions nerfés',
        other: 'Autres',
        balanced: 'Champions parfaitement équilibrés',
      },
      description: {
        buffed: 'Champions avec plus de buffs que de nerfs',
        nerfed: 'Champions avec plus de nerfs que de buffs',
        other:
          'Champions avec autant de buffs que de nerfs (ou avec des modifications de compétences pour lesquelles il est difficile de déterminer automatiquement si c’est un buff ou un nerf 🙃)',
        balanced: 'Champions avec aucun équilibrage',
      },
    },
    spell: s => `(${spell[s]}) :`,
    statIconAlt: name => `Icône stat ${wikiaStatsBalance[name]}`,
  },
  common: {
    challenge: {
      challenge: 'Défi',
      iconAlt: id => `Icône défi ${challengeShort(id)}`,
      thresholds: 'Seuils :',
      valueTier: (value, tier, o) =>
        `${value} : ${leagueTier[tier]}${o !== undefined && o.withComma ? ',' : ''}`,
    },
    championIconAlt: name => `Icône de ${name}`,
    championKey: key => `<Champion ${key}>`,
    cooldownSeconds: (cooldown, highlightClassName) => (
      <>
        <span className={highlightClassName}>récupération :</span> {cooldown.toLocaleString(locale)}
        s
      </>
    ),
    emptyChampionIconAlt: 'Icône de champion vide',
    fraction: (numerator, denominator, o) => {
      const res = `${numerator.toLocaleString(locale)} / ${denominator.toLocaleString(locale)}`
      return o !== undefined && o.withParenthesis ? `(${res})` : res
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
        0: 'Personnalisée', // Custom games
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
        78: 'Un pour Tous: Mode Miroir', // Howling Abyss — One For All: Mirror Mode games
        83: 'Coop vs IA Ultra Rapid Fire', // Summoner's Rift — Co-op vs AI Ultra Rapid Fire games
        91: 'Doom Bots Rank 1', // Summoner's Rift — Doom Bots Rank 1 games — Deprecated in patch 7.19 in favor of queueId 950"
        92: 'Doom Bots Rank 2', // Summoner's Rift — Doom Bots Rank 2 games — Deprecated in patch 7.19 in favor of queueId 950"
        93: 'Doom Bots Rank 5', // Summoner's Rift — Doom Bots Rank 5 games — Deprecated in patch 7.19 in favor of queueId 950"
        96: 'Ascension', // Crystal Scar — Ascension games — Deprecated in patch 7.19 in favor of queueId 910"
        98: 'Hexakill (Forêt Torturée)', // Twisted Treeline — 6v6 Hexakill games
        100: 'ARAM (Pont du Boucher)', // Butcher's Bridge — 5v5 ARAM games
        300: 'Legend of the Poro King', // Howling Abyss — Legend of the Poro King games — Deprecated in patch 7.19 in favor of queueId 920"
        310: 'Némésis', // Summoner's Rift — Nemesis games
        313: 'Micmac au Marché Noir', // Summoner's Rift — Black Market Brawlers games
        315: 'Nexus Siege', // Summoner's Rift — Nexus Siege games — Deprecated in patch 7.19 in favor of queueId 940"
        317: 'Definitely Not Dominion', // Crystal Scar — Definitely Not Dominion games
        318: 'ARURF', // Summoner's Rift — ARURF games — Deprecated in patch 7.19 in favor of queueId 900"
        325: 'All Random', // Summoner's Rift — All Random games
        400: 'Normale Draft', // Summoner's Rift — 5v5 Draft Pick games
        410: '5v5 Ranked Dynamic', // Summoner's Rift — 5v5 Ranked Dynamic games — Game mode deprecated in patch 6.22"
        420: 'Classée Solo/Duo', // Summoner's Rift — 5v5 Ranked Solo games
        430: 'Normale Aveugle', // Summoner's Rift — 5v5 Blind Pick games
        440: 'Classée FLEXXX', // Summoner's Rift — 5v5 Ranked Flex games
        450: 'ARAM', // Howling Abyss — 5v5 ARAM games
        460: '3v3 Blind Pick', // Twisted Treeline — 3v3 Blind Pick games — Deprecated in patch 9.23"
        470: '3v3 Ranked Flex', // Twisted Treeline — 3v3 Ranked Flex games — Deprecated in patch 9.23"
        600: 'Chasse à la Lune de Sang', // Summoner's Rift — Blood Hunt Assassin games
        610: 'Pulsar Sombre', // Cosmic Ruins — Dark Star: Singularity games
        700: 'Clash', // Summoner's Rift — Summoner's Rift Clash games
        720: 'Clash (ARAM)', // Howling Abyss — ARAM Clash games
        800: 'Co-op vs. AI Intermediate Bot', // Twisted Treeline — Co-op vs. AI Intermediate Bot games — Deprecated in patch 9.23"
        810: 'Co-op vs. AI Intro Bot games', // Twisted Treeline — Co-op vs. AI Intro Bot games — Deprecated in patch 9.23"
        820: 'Coop vs IA Débutant (Forêt Torturée)', // Twisted Treeline — Co-op vs. AI Beginner Bot games
        830: 'Coop vs IA Intro', // Summoner's Rift — Co-op vs. AI Intro Bot games
        840: 'Coop vs IA Débutant', // Summoner's Rift — Co-op vs. AI Beginner Bot games
        850: 'Coop vs IA Intermédiaire', // Summoner's Rift — Co-op vs. AI Intermediate Bot games
        900: 'ARURF', // Summoner's Rift — ARURF games
        910: 'Ascension', // Crystal Scar — Ascension games
        920: 'Légende du Roi Poro', // Howling Abyss — Legend of the Poro King games
        940: 'Siège du Nexus', // Summoner's Rift — Nexus Siege games
        950: 'Bots du Chaos (vote)', // Summoner's Rift — Doom Bots Voting games
        960: 'Bots du Chaos', // Summoner's Rift — Doom Bots Standard games
        980: 'Invasion Normal', // Valoran City Park — Star Guardian Invasion: Normal games
        990: 'Invasion Massacre', // Valoran City Park — Star Guardian Invasion: Onslaught games
        1000: 'PROJET : Chasseurs', // Overcharge — PROJECT: Hunters games
        1010: 'ARURF (Faille Enneigée)', // Summoner's Rift — Snow ARURF games
        1020: 'Un Pour Tous', // Summoner's Rift — One for All games
        1030: 'Odyssée Extraction Intro', // Crash Site — Odyssey Extraction: Intro games
        1040: 'Odyssée Extraction Cadet', // Crash Site — Odyssey Extraction: Cadet games
        1050: 'Odyssée Extraction Membre d’Équipage', // Crash Site — Odyssey Extraction: Crewmember games
        1060: 'Odyssée Extraction Capitaine', // Crash Site — Odyssey Extraction: Captain games
        1070: 'Odyssée Extraction Massacre', // Crash Site — Odyssey Extraction: Onslaught games
        1090: 'TFT', // Convergence — Teamfight Tactics games
        1100: 'Classée TFT', // Convergence — Ranked Teamfight Tactics games
        1110: 'TFT Tutoriel', // Convergence — Teamfight Tactics Tutorial games
        1111: 'TFT test', // Convergence — Teamfight Tactics test games
        1200: 'Nexus Blitz', // Nexus Blitz — Nexus Blitz games — Deprecated in patch 9.2"
        1300: 'Raid du Nexus', // Nexus Blitz — Nexus Blitz games
        1400: 'Grimoire Ultime', // Summoner's Rift — Ultimate Spellbook games
        1900: 'Pick URF', // Summoner's Rift — Pick URF games
        2000: 'Tutoriel 1', // Summoner's Rift — Tutorial 1
        2010: 'Tutoriel 2', // Summoner's Rift — Tutorial 2
        2020: 'Tutoriel 3', // Summoner's Rift — Tutorial 3
      },
      leagueTier,
      position,
      spell,
      wikiaStatsBalance,
    },
    layout: {
      account: 'Compte',
      activeGame: 'Partie active',
      championMasteries: 'Maîtrises de champions',
      game: 'Partie',
      home: 'Accueil',
      login: 'Connexion',
      logout: 'Déconnexion',
      profile: 'Profil',
      searchSummoner: 'Rechercher invocateur',
      signin: 'Inscription',
      yuumiIconAlt: 'Icône accueil (Yuumi)',
    },
    league: {
      label: {
        soloDuo: 'Classée Solo/Duo',
        flex: 'Classée FLEXXX',
      },
      leaguePoints: n => `${n} LP`,
      losses: pluralUnit('défaite'),
      wins: pluralUnit('victoire'),
      serie: 'Série :',
      tierRank: (tier, rank_) =>
        `${leagueTier[tier]}${rank_ !== undefined ? ` ${rank[rank_]}` : ''}`,
      tierRankAlt: (tier, rank_) =>
        `${leagueTier[tier]}${rank_ !== undefined ? ` ${rank[rank_]}` : ''}`,
      unranked: 'Non classé',
      unrankedIconAlt: 'Icône non classé',
    },
    masteryIconAlt: level => `Icône niveau ${level}`,
    nChampionsFraction: (n, total) => `${plural('champion')(n)} / ${total.toLocaleString(locale)}`,
    nResults: plural('résultat'),
    number: (n, o) =>
      o !== undefined && o.withParenthesis
        ? `(${n.toLocaleString(locale)})`
        : n.toLocaleString(locale),
    numberK: n => `${n.toLocaleString(locale)}k`,
    percents: n => `${n.toLocaleString(locale)} %`,
    positionIconAlt: p => `Icône position ${position[p]}`,
    randomChampion: 'Champion aléatoire',
    runeIconAlt: name => `Icône rune ${name}`,
    searchChamion: 'Rechercher champion',
    spellIconAlt: name => `Icône du sort ${name}`,
    spellKey: key => `<Sort ${key}>`,
    summonerIconAlt: name => `Icône de ${name}`,
  },
  home: {
    aram: 'ARAM',
    factions: 'Factions',
    globetrotterChallenges: 'Défis “Globe-trotteur”',
    isntEndorsed:
      'La Quête isn’t endorsed by Riot Games and doesn’t reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.',
    specificBalanceChanges: 'Équilibrages spécifiques',
    theQuest: 'La Quête.',
  },
  masteries: {
    addShard: 'Ajouter un fragment',
    chestAvailable: 'coffre disponible',
    chestIconAlt: 'Icône de coffre',
    chestGranted: 'coffre obtenu',
    nShards: plural('fragment'),
    nTokens: plural('jeton'),
    points: (points, total) =>
      `${points.toLocaleString(locale)}${
        total !== undefined ? ` / ${total.toLocaleString(locale)}` : ''
      } points`,
    pointsSinceLastLevel: (points, level) =>
      `${plural('point')(points)} depuis le niveau ${level.toLocaleString(locale)}`,
    pointsUntilNextLevel: (points, level) =>
      `${plural('point')(points)} jusqu'au niveau ${level.toLocaleString(locale)}`,
    removeShard: 'Enlever un fragment',
    removeNShards: n => `enlever ${plural('fragment')(n)}`,
    tokenIconAlt: (level, o) =>
      `Jeton de maîtrise ${level}${o !== undefined && o.notObtained ? ' (non obtenu)' : ''}`,
  },
}

function plural(unit: string) {
  return (n: number): string => `${n.toLocaleString(locale)} ${pluralUnit(unit)(n)}`
}

function pluralUnit(unit: string) {
  return (n: number): string => `${unit}${n < 2 ? '' : 's'}`
}
