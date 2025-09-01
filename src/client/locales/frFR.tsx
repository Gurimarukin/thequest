import { DayJs } from '../../shared/models/DayJs'
import type { WikiStatsBalanceKey } from '../../shared/models/WikiStatsBalance'
import type { SpellName } from '../../shared/models/api/SpellName'
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
  EMERALD: 'Émeraude',
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
  W: 'Z',
  E: 'E',
  R: 'R',
}

const wikiStatsBalance: Dict<WikiStatsBalanceKey, string> = {
  dmg_dealt: 'Dégâts infligés',
  dmg_taken: 'Dégâts subis',
  healing: 'Efficacité des soins',
  shielding: 'Efficacité des boucliers',
  ability_haste: 'Accélération de compétences',
  energyregen_mod: 'Régénération d’énergie',
  total_as: 'Vitesse d’attaque',
  movement_speed: 'Vitesse de déplacement',
  tenacity: 'Tenacité',
}

const frFRTranslation: Translation = {
  activeGame: {
    poroIconAlt: 'Icône de poro',
    bannedAtTurn: pickTurn => `Banni au tour ${pickTurn}`,
    empty: 'aucun',
    gameStartedAt: date =>
      `Partie commencée à ${date.toLocaleTimeString(locale)} (${date.toLocaleDateString(locale)})`,
    loading: 'chargement',
    notInGame: 'pas en partie.',
    theQuestProgression: 'Progression de La Quête',
    totals: (totalMasteryLevel, translatedTotalMasteryPoints, highlightClassName) => (
      <>
        (<span className={highlightClassName}>{nls(totalMasteryLevel)}</span> —{' '}
        <span className={highlightClassName}>{translatedTotalMasteryPoints}</span>)
      </>
    ),
    masteryScoreAndPoints: 'Score — Points de maîtrise',
    otpIndex: (otpIndex, highlightClassName) => (
      <>
        Indice d’OTP : <span className={highlightClassName}>{nls(otpIndex)}</span>
      </>
    ),
    mainRoles: 'Rôles principaux :',
    currentRole: 'Rôle actuel :',
  },
  mapChanges: {
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
        other: (
          <>
            Champions avec autant de buffs que de nerfs (ou avec des modifications de compétences
            pour lesquelles il est difficile de déterminer automatiquement si c’est un buff ou un
            nerf  <EmojiUpsideDown />)
          </>
        ),
        balanced: 'Champions avec aucun équilibrage',
      },
    },
    spell: s => `(${spell[s]}) :`,
    statIconAlt: name => `Icône stat ${wikiStatsBalance[name]}`,
  },
  common: {
    challenge: {
      challenge: 'Défi',
      iconAlt: id => `Icône défi ${challengeShort(id)}`,
      thresholds: 'Seuils :',
      valueTier: (value, tier, o) =>
        `${value} : ${leagueTier[tier]}${o?.withComma === true ? ',' : ''}`,
    },
    championIconAlt: name => `Icône de ${name}`,
    championKey: key => `<Champion ${key}>`,
    cooldownSeconds: (cooldownSeconds, highlightClassName) => (
      <>
        <span className={highlightClassName}>récupération :</span>{' '}
        {DayJs.Duration.formatSeconds(cooldownSeconds)}
      </>
    ),
    emptyChampionIconAlt: 'Icône de champion vide',
    error: 'erreur',
    errors: {
      addFavoriteError: 'Erreur lors de l’ajout du favori',
      fetchUserError: 'Erreur lors de la récupération l’utilisateur',
      removeFavoriteError: 'Erreur lors de la suppression du favori',
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
        78: 'Un Pour Tous : Mode Miroir', // Howling Abyss — One For All: Mirror Mode games
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
        480: 'Partie accélérée', // Swiftplay
        490: 'Partie rapide', // Summoner's Rift — Normal (Quickplay)
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
        870: 'Coop vs IA Intro',
        880: 'Coop vs IA Débutant',
        890: 'Coop vs IA Intermédiaire',
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
        1210: 'TFT Trésor de Choncc',
        1300: 'Raid du Nexus', // Nexus Blitz — Nexus Blitz games
        1400: 'Grimoire Ultime', // Summoner's Rift — Ultimate Spellbook games
        1700: 'Arena', // Rings of Wrath — Arena
        1710: 'Arena', // Rings of Wrath — Arena
        1810: 'Swarm', // Swarm — Swarm Mode Games
        1820: 'Swarm', // Swarm Mode Games — Swarm
        1830: 'Swarm', // Swarm Mode Games — Swarm
        1840: 'Swarm', // Swarm Mode Games — Swarm
        1900: 'Pick URF', // Summoner's Rift — Pick URF games
        2000: 'Tutoriel 1', // Summoner's Rift — Tutorial 1
        2010: 'Tutoriel 2', // Summoner's Rift — Tutorial 2
        2020: 'Tutoriel 3', // Summoner's Rift — Tutorial 3
        2300: 'Brawl', // The Bandlewood — Brawl map
      },
      leagueTier,
      position,
      spell,
      wikiStatsBalance,
    },
    layout: {
      account: 'Compte',
      activeGame: 'Partie active',
      championMasteries: 'Maîtrises de champions',
      game: 'Partie',
      home: 'Accueil',
      aramSpecificBalanceChanges: 'Équilibrages spécifiques ARAM',
      urfSpecificBalanceChanges: 'Équilibrages spécifiques URF',
      globetrotterChallenges: 'Défis “Globe-trotteur”',
      login: 'Connexion',
      logout: 'Déconnexion',
      profile: 'Profil',
      searchSummoner: 'Rechercher invocateur',
      register: 'Inscription',
      yuumiIconAlt: 'Icône accueil (Yuumi)',
    },
    league: {
      label: {
        soloDuo: 'Classée Solo/Duo',
        flex: 'Classée FLEXXX',
      },
      leaguePoints: n => `${n} PL`,
      losses: pluralUnit('défaite'),
      wins: pluralUnit('victoire'),
      serie: 'Série :',
      tierRank: (tier, rank_) =>
        `${leagueTier[tier]}${rank_ !== undefined ? ` ${rank[rank_]}` : ''}`,
      tierRankAlt: (tier, rank_) =>
        `${leagueTier[tier]}${rank_ !== undefined ? ` ${rank[rank_]}` : ''}`,
      unranked: 'Non classé',
      unrankedIconAlt: 'Icône non classé',
      previousSplit: 'Split précédent :',
    },
    masteryIconAlt: level => `Icône niveau ${level}`,
    nChampionsFraction: (n, total) => `${plural('champion')(n)} / ${nls(total)}`,
    nResults: plural('résultat'),
    notFound: 'introuvable.',
    number: (n, o) => (o?.withParenthesis === true ? `(${nls(n)})` : nls(n)),
    numberK: n => `${nls(n)}k`,
    numberM: n => `${nls(n)}M`,
    percents: n => `${nls(n)} %`,
    randomChampion: 'Champion aléatoire',
    runeIconAlt: name => `Icône rune ${name}`,
    searchChamion: 'Rechercher champion',
    spellIconAlt: name => `Icône du sort ${name}`,
    spellKey: key => `<Sort ${key}>`,
    level: (level, highlightClassName) => (
      <>
        niveau <span className={highlightClassName}>{nls(level)}</span>
      </>
    ),
    summonerLevel: 'Niveau d’invocateur',
    oldSummonerName: 'Ancien nom d’invocateur :',
    summonerIconAlt: name => `Icône de ${name}`,
    form: {
      alreadyAnAccount: 'Déjà un compte ?',
      confirmPassword: 'Confirmation mot de passe :',
      login: 'Se connecter',
      loginWithDiscord: discordLogo => <>Se connecter avec {discordLogo}</>,
      noAccount: 'Pas de compte ?',
      or: 'ou',
      password: 'Mot de passe :',
      passwordsShouldBeIdentical: 'Les mots de passe doivent être identiques',
      register: 'S’inscrire',
      registerWithDiscord: discordLogo => <>S’inscrire avec {discordLogo}</>,
      userName: 'Utilisateur :',
    },
  },
  home: {
    isntEndorsed:
      'La Quête isn’t endorsed by Riot Games and doesn’t reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.',
    theQuest: 'La Quête.',
  },
  masteries: {
    addShard: 'Ajouter un fragment',
    filters: {
      all: 'tous',
      level: level => `Niveau ${level}${level === 10 ? '+' : ''}`,
      order: {
        desc: 'Tri décroissant',
        asc: 'Tri croissant',
      },
      nineAndLess: '9 et moins',
      tenAndMore: '10+',
      sort: {
        level: 'Trier par niveau > jetons > points',
        percents: 'Trier par pourcents > points',
        points: 'Trier par points',
        name: 'Trier par nom',
      },
      sortShort: {
        level: 'niv',
        percents: '%',
        points: 'pts',
        name: 'abc',
      },
      view: {
        aram: 'Vue ARAM',
        compact: 'Vue compacte',
        factions: 'Vue factions',
        histogram: 'Vue histogramme',
        urf: 'Vue URF',
      },
      viewShort: {
        aram: 'ARAM',
        compact: 'Compact',
        factions: 'Factions',
        histogram: 'Histogramme',
        urf: 'URF',
      },
    },
    modal: {
      confirm: 'Confirmer',
      masteryChange: (from, to) => `Changement de maîtrise ${nls(from)} à ${nls(to)}`,
      nChangesDetected: n => {
        const s = n < 2 ? '' : 's'
        return (
          <>
            Changement{s} de niveau detecté{s} depuis la dernière modification de fragments.
            <br />
            Peut-être en avez-vous dépensés (des fragments) ?
          </>
        )
      },
      no: 'Non',
      noForAll: 'Non pour tout',
      removeNShards: n => `enlever ${plural('fragment')(n)}`,
      yes: 'Oui',
      yesForAll: 'Oui pour tout',
    },
    nShards: plural('fragment'),
    nMarksOfMastery: (earned, total) => `${plural('jeton')(earned)} / ${nls(total)}`,
    points: (points, total, highlightClassName) => (
      <>
        <span className={highlightClassName}>{nls(points)}</span>{' '}
        {total !== undefined ? (
          <>
            / <span className={highlightClassName}>{nls(total)}</span>{' '}
          </>
        ) : null}
        points
      </>
    ),
    pointsSinceLastLevel: (points, level) =>
      points < 0
        ? `${plural('point')(Math.abs(points))} jusqu’au niveau ${nls(level)}`
        : `${plural('point')(points)} depuis le niveau ${nls(level)}`,
    pointsUntilNextLevel: (points, level) =>
      points < 0
        ? `niveau ${nls(level)} dépassé de ${plural('point')(Math.abs(points))}`
        : `${plural('point')(points)} jusqu’au niveau ${nls(level)}`,
    removeShard: 'Enlever un fragment',
    updateShardsSucces: 'Fragments modifiés',
    updateShardsError: 'Erreur lors de la modification des fragments',
  },
  notFound: {
    home: 'Accueil',
    thisPageDoesntExist: 'Cette page n’existe pas.',
  },
  register: {
    accessRecentSearches: recentSearches =>
      `Voir les ${nls(recentSearches)} recherches les plus récentes (stockage local du navigateur)`,
    accessSummonerDetails: 'Accéder à tous les détails d’un invocateur via la recherche',
    addSummonerToFavorites: 'Ajouter des invocateur en favori',
    customiseChampionPositions: 'Personnaliser les champions associés à un rôle',
    discordHallOfFameRanking:
      'Classement dans le temple de la renommée sur le serveur Discord du capitaine :',
    discordServer: 'Serveur Discord',
    discordServerIconAlt: name => `Icône du serveur ${name}`,
    join: 'Rejoindre',
    keepTrackOfShards: 'Garder le compte des fragments de champions',
    quickSummonerAccess: 'Accès rapide au profil d’invocateur lié',
    registrationExplanation: (
      <>
        Avoir un compte lié à un compte Discord, lui-même lié à un compte Riot Games, permet d’avoir
        accès à plus de fonctionnalités.
        <br />
        Comme Riot Games, c’est tout pourri, il n’est pas possible de lier directement un compte
        Riot Games. Il faut passer par un compte Discord et que celui-ci soit lié à un compte Riot
        Games.
      </>
    ),
    withAccountLinked: 'Avec un compte lié à Riot Games',
    withAccountNotLinked: 'Avec un compte NON lié à Riot Games',
    withoutAccount: 'Sans compte',
  },
  summoner: {
    masteriesCache: {
      lastUpdate: insertedAt =>
        `Dernière mise à jour des maîtrises à ${insertedAt.toLocaleTimeString(locale)}`,
      duration: minutes =>
        `(durée du cache : ${minutes.toLocaleString(locale, {
          maximumFractionDigits: 2,
        })} ${pluralUnit('minute')(minutes)})`,
    },
    masteryScore: 'Score de maîtrise :',
    masteryPoints: 'Points de maîtrise :',
    otpIndex: 'Indice d’OTP :',
    otpIndexExplanation:
      '(nombre de champions cumulant la moitié du nombre total de points de maîtrise)',
    masteriesExplanation: (
      <>
        <li>Niveau de maîtrise 10 ou plus = 100%</li>
        <li>
          Il faut 75 600 points pour atteindre le niveau 10 (compte pour la moitié du calcul de
          pourcents)
        </li>
        <li>
          Il faut 7 Marques de Maîtrise pour atteindre le niveau 10 (compte pour l’autre moitié du
          calcul)
        </li>
      </>
    ),
    percentsProgression: (percents, highlightClassName) => (
      <>
        Progression : <span className={highlightClassName}>{nls(percents)} %</span>
      </>
    ),
  },
  router: {
    theQuest: 'La Quête',
    game: 'partie',
    aram: 'ARAM',
    urf: 'URF',
    factions: 'Factions',
    login: 'Connexion',
    register: 'Inscription',
    notFound: 'Page non trouvée',
  },
}

export default frFRTranslation

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
