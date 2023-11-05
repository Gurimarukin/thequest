import type { SpellName } from '../../shared/models/api/SpellName'
import type {
  ChampionFaction,
  ChampionFactionOrNone,
} from '../../shared/models/api/champion/ChampionFaction'
import type { ChampionPosition } from '../../shared/models/api/champion/ChampionPosition'
import type { LeagueRank } from '../../shared/models/api/league/LeagueRank'
import type { LeagueTier } from '../../shared/models/api/league/LeagueTier'
import type { WikiaStatsBalanceKey } from '../../shared/models/wikia/WikiaStatsBalance'
import { type Dict } from '../../shared/utils/fp'

import { EmojiUpsideDown } from '../imgs/svgs/emojis'
import type { Translation } from '../models/Translation'
import { TranslationUtils } from '../utils/TranslationUtils'

const locale = 'es-ES'

const challengeShort = TranslationUtils.challenge(
  id => `<Challenge ${id}>`,
  f => factionOrNone[f],
)

const factionChallengeName: Dict<ChampionFaction, string> = {
  bandle: 'EL PEQUENIO PETO COUILLOS',
  bilgewater: 'TODOS DEBEN PAGARTODOS',
  demacia: 'EL BG TIMIDO',
  freljord: 'PRIMO PATO DEL GELATARIA',
  ionia: 'ATTENTION A EL MAESTRO YI',
  ixtal: 'TERRIBLO FORESTA',
  noxus: 'LA FORCAS PRIMO TODO',
  piltover: 'EL SCIENTIFICO MAJESTUOR',
  shadowIsles: 'EL DEPARTEMENTE DEL SOMBRERO',
  shurima: 'EL PRESIDENTE DEL DESERTO',
  targon: 'EL MAESTROS DEL MONTAGNA',
  void: '(NO HOMO GRITAR)',
  zaun: 'EL FAVELA FIESTA',
}

const factionOrNone: Dict<ChampionFactionOrNone, string> = {
  bandle: 'EL PEQUENIO',
  bilgewater: 'EL PIRATO',
  demacia: 'EL STYLAR',
  freljord: 'EL GLAGLA',
  ionia: 'EL FLORA',
  ixtal: 'EL FORESTAR',
  noxus: 'EL DIABOLICO',
  piltover: 'MUCHO SCIENTIFICO',
  shadowIsles: 'ISLAS SOMBRERO',
  shurima: 'DESERTICO MUY BIEN',
  targon: 'EL MONTAGNA',
  void: 'EL NADA',
  zaun: 'EL FAVELA',
  none: 'NO FACTIONO',
}

const leagueTier: Dict<LeagueTier, string> = {
  IRON: 'FERO',
  BRONZE: 'BRONCE',
  SILVER: 'PLATA',
  GOLD: 'ORO',
  PLATINUM: 'PLATINO',
  EMERALD: 'ÉSMERALDA',
  DIAMOND: 'DIAMANTE',
  MASTER: 'MAESTRO',
  GRANDMASTER: 'MAESTRO GRANDE',
  CHALLENGER: 'MUCHO PUISSANTE',
}

const position: Dict<ChampionPosition, string> = {
  top: 'SUPERIOR',
  jun: 'FORESTA',
  mid: 'CENTRAL',
  bot: 'INFERIOR',
  sup: 'APOYO',
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

const wikiaStatsBalance: Dict<WikiaStatsBalanceKey, string> = {
  dmg_dealt: 'DAMAGO TEKO',
  dmg_taken: 'DAMAGO REDUCO',
  healing: 'SUAVEMENTE',
  shielding: 'SHIELDO',
  ability_haste: 'RAPIDO SPELLO',
  energy_regen: 'RECUPARATION ENERGIA',
  attack_speed: 'RAPIDO DATTAQO',
  movement_speed: 'RAPIDO DE VELOCIDAD',
  tenacity: 'TENACITO',
}

const esESTranslation: Translation = {
  activeGame: {
    bannedAtTurn: pickTurn => `NO BIENVENUTO ${pickTurn}`,
    empty: 'NADA',
    gameStartedAt: date =>
      `JUEGO STARTA ${date.toLocaleTimeString(locale)} (${date.toLocaleDateString(locale)})`,
    loading: 'CHARGAMENTO',
    notInGame: 'NO EN JUEGO.',
    theQuestProgression: 'QUESTO PROGRESSIO',
    totals: (totalMasteryLevel, translatedTotalMasteryPoints, highlightClassName) => (
      <>
        (<span className={highlightClassName}>{totalMasteryLevel.toLocaleString(locale)}</span> —{' '}
        <span className={highlightClassName}>{translatedTotalMasteryPoints}</span>)
      </>
    ),
    masteryScoreAndPoints: 'SCORO — POINT DEL MAITRISO',
    otpIndex: (otpIndex, highlightClassName) => (
      <>
        INDICO DEL OTP :{' '}
        <span className={highlightClassName}>{otpIndex.toLocaleString(locale)}</span>
      </>
    ),
    mainRoles: 'ROLO PRIMO :',
    currentRole: 'ROLO IMO :',
  },
  aram: {
    category: {
      label: {
        buffed: 'CAMPEONE MAXO',
        nerfed: 'CAMPEONE MINO',
        other: 'EL PAYASO',
        balanced: 'EQUILIBRIDAD',
      },
      description: {
        buffed: 'MA CAMPEONE BUENOS MAXO',
        nerfed: 'MA CAMPEONE NO BUENE MAXO',
        other: (
          <>
            Champions avec autant de buffs que de nerfs (ou avec des modifications de compétences
            pour lesquelles il est difficile de déterminer automatiquement si c’est un buff ou un
            nerf  <EmojiUpsideDown />)
          </>
        ),
        balanced: 'PERFECTO CAMPEONE',
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
    error: 'PROBLEMO',
    errors: {
      addFavoriteError: 'PROBLEMO',
      fetchUserError: 'PROBLEMO',
      removeFavoriteError: 'PROBLEMO',
    },
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
        2: '5v5 A CIEGAS', // Summoner's Rift — 5v5 Blind Pick games — Deprecated in patch 7.19 in favor of queueId 430"
        4: '5v5 CLASIFICATORIA SOLO / DUO', // Summoner's Rift — 5v5 Ranked Solo games — Deprecated in favor of queueId 420"
        6: '5v5 CLASIFICATORIA FLEXEIBLE', // Summoner's Rift — 5v5 Ranked Premade games — Game mode deprecated"
        7: 'COOPERATIVA', // Summoner's Rift — Co-op vs AI games — Deprecated in favor of queueId 32 and 33"
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
        78: 'UNO POR TODOS : MIRORO', // Howling Abyss — One For All: Mirror Mode games
        83: 'COOPERATIVA ULTRA RAPIDO FUEGO', // Summoner's Rift — Co-op vs AI Ultra Rapid Fire games
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
        420: 'CLASIFICATORIA SOLO / DUO', // Summoner's Rift — 5v5 Ranked Solo games
        430: 'NORMALO NO MIRO', // Summoner's Rift — 5v5 Blind Pick games
        440: 'CLASIFICATORIA FLEXEIBLE', // Summoner's Rift — 5v5 Ranked Flex games
        450: 'ARAMO', // Howling Abyss — 5v5 ARAM games
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
      account: 'SESSION',
      activeGame: 'EN JUEGO',
      championMasteries: 'EL MAESTRO DE CAMPEONE',
      game: 'JUEGO',
      home: 'CASA',
      aramSpecificBalanceChanges: 'ÉQUILIBRO ESPECIAL aram',
      globetrotterChallenges: 'QUESTO “GLOBO-TROTORO”',
      login: 'CONNEXION',
      logout: 'SALIR',
      profile: 'PROFILO',
      searchSummoner: 'RECHERCHAR INVOCADOR',
      register: 'INSCRIPTAR',
      yuumiIconAlt: 'ICONO (Yuumi)',
    },
    league: {
      label: {
        soloDuo: 'CLASIFICATORIA SOLO/DUO',
        flex: 'CLASIFICATORIA FLEXXX',
      },
      leaguePoints: n => `${n} PL`,
      losses: pluralUnit('DEFETO'),
      wins: pluralUnit('VICTORIA'),
      serie: 'SERIO :',
      tierRank: (tier, rank_) =>
        `${leagueTier[tier]}${rank_ !== undefined ? ` ${rank[rank_]}` : ''}`,
      tierRankAlt: (tier, rank_) =>
        `${leagueTier[tier]}${rank_ !== undefined ? ` ${rank[rank_]}` : ''}`,
      unranked: 'NO CLASIFICATORIA',
      unrankedIconAlt: 'ICONO',
      previousSplit: 'SPLITO PRECEDO :',
    },
    masteryIconAlt: level => `ICONO NIVELO ${level}`,
    nChampionsFraction: (n, total) => `${plural('CAMPEONE')(n)} / ${total.toLocaleString(locale)}`,
    nResults: plural('RESULTO'),
    notFound: 'PROBLEMO.',
    number: (n, o) =>
      o !== undefined && o.withParenthesis
        ? `(${n.toLocaleString(locale)})`
        : n.toLocaleString(locale),
    numberK: n => `${n.toLocaleString(locale)}k`,
    numberM: n => `${n.toLocaleString(locale)}M`,
    percents: n => `${n.toLocaleString(locale)} %`,
    randomChampion: 'CAMPEONE ALEATORIO',
    runeIconAlt: name => `ICONO ${name}`,
    searchChamion: 'RECHERCHAR EL CHAMPIONO',
    spellIconAlt: name => `ICONO DU SORTILEGO ${name}`,
    spellKey: key => `<SORTO ${key}>`,
    level: (level, highlightClassName) => (
      <>
        niveau <span className={highlightClassName}>{level.toLocaleString(locale)}</span>
      </>
    ),
    summonerLevel: 'INVOCADOR LEVELITO',
    summonerIconAlt: name => `ICONO DEL ${name}`,
  },
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
  home: {
    isntEndorsed:
      'EL QUESTO isn’t endorsed by Riot Games and doesn’t reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.',
    theQuest: 'EL QUESTO.',
  },
  masteries: {
    addShard: 'ADAR EL FRAGMENTO',
    chestAvailable: 'COFFRO DISPONIBLA',
    chestGranted: 'COFFRO OKIDOKI',
    filters: {
      all: 'AYYYY',
      fiveAndSix: '5 E 6',
      fourAndLess: '4 E MINOS',
      level: level => `NIVATO ${level}`,
      order: {
        desc: 'EL GRANDE TO MINO',
        asc: 'EL MINO TO GRANDE',
      },
      sixAndLess: '6 E MINO',
      sort: {
        name: 'TRIAR PER NOME',
        percents: ({ withShards }) => `TRIAR PER % > ${withShards ? 'FRAGMENTO > ' : ''}POINTITO`,
        points: 'TRIAR PER POINTITO',
      },
      sortShort: {
        name: 'JAJA',
        percents: '%',
        points: 'TITO',
      },
      view: {
        aram: 'ARAMO',
        compact: 'COMPACTO',
        factions: 'FACTIONOS',
        histogram: 'HISTOGRAMMO',
      },
      viewShort: {
        aram: 'ARAMO',
        compact: 'COMPACTO',
        factions: 'FACTIONOS',
        histogram: 'HISTOGRAMO',
      },
    },
    modal: {
      confirm: 'ACEPTAR',
      masteryChange: (from, to) =>
        `CHANGAR DEL MAITRISO ${from.toLocaleString(locale)} à ${to.toLocaleString(locale)}`,
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
      no: 'NO',
      noForAll: 'NO PRO TODOS',
      removeNShards: n => `ENLEVAR ${plural('FRAGMENTO')(n)}`,
      yes: 'SI',
      yesForAll: 'SI JAJAJAJA',
    },
    nShards: plural('FRAGMENTO'),
    nTokens: plural('TOKO'),
    points: (points, total, highlightClassName) => (
      <>
        <span className={highlightClassName}>
          {points.toLocaleString(locale)}
          {total !== undefined ? ` / ${total.toLocaleString(locale)}` : null}
        </span>{' '}
        points
      </>
    ),
    pointsSinceLastLevel: (points, level) =>
      `${plural('POINTITO')(points)} DEL NIVELO ${level.toLocaleString(locale)}`,
    pointsUntilNextLevel: (points, level) =>
      `${plural('POINTITO')(points)} PARA EL NIVOLO ${level.toLocaleString(locale)}`,
    removeShard: 'DISCALIFIAR EL FRAGMENTO',
    tokenIconAlt: (level, o) =>
      `EL JETONO ${level.toLocaleString(locale)}${
        o !== undefined && o.notObtained ? ' (NO OBTENU)' : ''
      }`,
    updateShardsSucces: 'FRAGMENTO MODIFIAR',
    updateShardsError: 'PROBLEMO EN EL MODIFICATION DEL FRAGMENTO',
  },
  notFound: {
    home: 'CASA',
    thisPageDoesntExist: 'EL MAESTRO PROBLEMO.',
  },
  register: {
    accessRecentSearches: recentSearches =>
      `Voir les ${recentSearches.toLocaleString(
        locale,
      )} recherches les plus récentes (stockage local du navigateur)`,
    accessSummonerDetails: 'Accéder à tous les détails d’un invocateur via la recherche',
    addSummonerToFavorites: 'Ajouter des invocateur en favori',
    customiseChampionPositions: 'Personnaliser les champions associés à un rôle',
    discordHallOfFameRanking:
      'Classement dans le temple de la renommée sur le serveur Discord du capitaine :',
    discordServer: 'Serveur Discord',
    discordServerIconAlt: name => `Icône du serveur ${name}`,
    join: 'Rejoindre',
    keepTrackOfShards: 'Garder le compte des fragments de champions (à la main, désolé)',
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
        <li>
          De la maîtrise 0 à la maîtrise 5, les pourcents correspondent aux points de maîtrise.
        </li>
        <li>Maîtrise 5 = 50 %</li>
        <li>Chaque fragment = 3 %</li>
        <li>
          Chaque jeton pour la maîtrise 6 = 7 % (maîtrise 5 + 1 jeton = 57 % ; maîtrise 5 + 2 jetons
          = 64 %)
        </li>
        <li>Maîtrise 6 = 67 %</li>
        <li>
          Chaque jeton pour la maîtrise 7 = 10 % (maîtrise 6 + 1 jeton = 77 % ; maîtrise 6 + 2
          jetons = 87 % ; maîtrise 6 + 3 jetons = 97 %)
        </li>
        <li>Maîtrise 7 = 100 %</li>
      </>
    ),
    percentsProgression: (percents, highlightClassName) => (
      <>
        Progression :{' '}
        <span className={highlightClassName}>{percents.toLocaleString(locale)} %</span>
      </>
    ),
  },
}

export default esESTranslation

function plural(unit: string) {
  return (n: number): string => `${n.toLocaleString(locale)} ${pluralUnit(unit)(n)}`
}

function pluralUnit(unit: string) {
  return (n: number): string => `${unit}${n < 2 ? '' : 'S'}`
}