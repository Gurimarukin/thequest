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
  W: 'W',
  E: 'E',
  R: 'R',
}

const wikiStatsBalance: Dict<WikiStatsBalanceKey, string> = {
  dmg_dealt: 'DAMAGO TEKO',
  dmg_taken: 'DAMAGO REDUCO',
  healing: 'SUAVEMENTE',
  shielding: 'SHIELDO',
  ability_haste: 'RAPIDO SPELLO',
  energyregen_mod: 'RECUPARATION ENERGIA',
  total_as: 'RAPIDO DATTAQO',
  movement_speed: 'RAPIDO DE VELOCIDAD',
  tenacity: 'TENACITO',
}

const esESTranslation: Translation = {
  activeGame: {
    poroIconAlt: 'ICONO DE PORO',
    bannedAtTurn: pickTurn => `NO BIENVENUTO ${pickTurn}`,
    empty: 'NADA',
    gameStartedAt: date =>
      `JUEGO STARTA ${date.toLocaleTimeString(locale)} (${date.toLocaleDateString(locale)})`,
    loading: 'CHARGAMENTO',
    notInGame: 'NO EN JUEGO.',
    theQuestProgression: 'QUESTO PROGRESSIO',
    totals: (totalMasteryLevel, translatedTotalMasteryPoints, highlightClassName) => (
      <>
        (<span className={highlightClassName}>{nls(totalMasteryLevel)}</span> —{' '}
        <span className={highlightClassName}>{translatedTotalMasteryPoints}</span>)
      </>
    ),
    masteryScoreAndPoints: 'SCORO — POINT DEL MAITRISO',
    otpIndex: (otpIndex, highlightClassName) => (
      <>
        INDICO DEL OTP: <span className={highlightClassName}>{nls(otpIndex)}</span>
      </>
    ),
    mainRoles: 'ROLO PRIMO:',
    currentRole: 'ROLO IMO:',
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
            CAMPEONES CON TANTOS BUFFS COMO NERFS (O CON MODIFICACIONES DE HABILIDADES PARA LAS QUE
            ES DIFÍCIL DETERMINAR AUTOMÁTICAMENTE SI SE TRATA DE UN BUFF O UN NERF {' '}
            <EmojiUpsideDown />)
          </>
        ),
        balanced: 'PERFECTO CAMPEONE',
      },
    },
    spell: s => `(${spell[s]}):`,
    statIconAlt: name => `Icône stat ${wikiStatsBalance[name]}`,
  },
  common: {
    challenge: {
      challenge: 'DESAFÍO',
      iconAlt: id => `Icône défi ${challengeShort(id)}`,
      thresholds: 'UMBRALES:',
      valueTier: (value, tier, o) =>
        `${value}: ${leagueTier[tier]}${o?.withComma === true ? ',' : ''}`,
    },
    championIconAlt: name => `Icône de ${name}`,
    championKey: key => `<Champion ${key}>`,
    cooldownSeconds: (cooldown, highlightClassName) => (
      <>
        <span className={highlightClassName}>RECUPERACIÓN:</span> {nls(cooldown)}s
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
        0: 'PERSONALIZADO', // Custom games
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
        78: 'UNO POR TODOS: MIRORO', // Howling Abyss — One For All: Mirror Mode games
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
        490: 'PARTIDO RAPIDO', // Summoner's Rift — Normal (Quickplay)
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
        1000: 'PROJET: Chasseurs', // Overcharge — PROJECT: Hunters games
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
        1700: 'ARENA', // Rings of Wrath — Arena
        1710: 'ARENA', // Rings of Wrath — Arena
        1900: 'Pick URF', // Summoner's Rift — Pick URF games
        2000: 'Tutoriel 1', // Summoner's Rift — Tutorial 1
        2010: 'Tutoriel 2', // Summoner's Rift — Tutorial 2
        2020: 'Tutoriel 3', // Summoner's Rift — Tutorial 3
      },
      leagueTier,
      position,
      spell,
      wikiStatsBalance,
    },
    layout: {
      account: 'SESSION',
      activeGame: 'EN JUEGO',
      championMasteries: 'EL MAESTRO DE CAMPEONE',
      game: 'JUEGO',
      home: 'CASA',
      aramSpecificBalanceChanges: 'ÉQUILIBRO ESPECIAL aram',
      urfSpecificBalanceChanges: 'ÉQUILIBRO ESPECIAL urf',
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
      serie: 'SERIO:',
      tierRank: (tier, rank_) =>
        `${leagueTier[tier]}${rank_ !== undefined ? ` ${rank[rank_]}` : ''}`,
      tierRankAlt: (tier, rank_) =>
        `${leagueTier[tier]}${rank_ !== undefined ? ` ${rank[rank_]}` : ''}`,
      unranked: 'NO CLASIFICATORIA',
      unrankedIconAlt: 'ICONO',
      previousSplit: 'SPLITO PRECEDO:',
    },
    masteryIconAlt: level => `ICONO NIVELO ${level}`,
    nChampionsFraction: (n, total) => `${plural('CAMPEONE')(n)} / ${nls(total)}`,
    nResults: plural('RESULTO'),
    notFound: 'PROBLEMO.',
    number: (n, o) => (o?.withParenthesis === true ? `(${nls(n)})` : nls(n)),
    numberK: n => `${nls(n)}k`,
    numberM: n => `${nls(n)}M`,
    percents: n => `${nls(n)} %`,
    randomChampion: 'CAMPEONE ALEATORIO',
    runeIconAlt: name => `ICONO ${name}`,
    searchChamion: 'RECHERCHAR EL CHAMPIONO',
    spellIconAlt: name => `ICONO DU SORTILEGO ${name}`,
    spellKey: key => `<SORTO ${key}>`,
    level: (level, highlightClassName) => (
      <>
        NIVEL <span className={highlightClassName}>{nls(level)}</span>
      </>
    ),
    summonerLevel: 'INVOCADOR LEVELITO',
    oldSummonerName: 'Antiguo nombre de invocador:',
    summonerIconAlt: name => `ICONO DEL ${name}`,
    form: {
      alreadyAnAccount: '¿YA TIENE UNA CUENTA?',
      confirmPassword: 'CONFIRMAR CONTRASEÑA:',
      login: 'INICIAR SESIÓN',
      loginWithDiscord: discordLogo => <>CONECTAR CON {discordLogo}</>,
      noAccount: '¿NO TIENE CUENTA?',
      or: 'O',
      password: 'CONTRASEÑA:',
      passwordsShouldBeIdentical: 'LAS CONTRASEÑAS DEBEN SER IDÉNTICAS',
      register: 'INSCRÍBETE',
      registerWithDiscord: discordLogo => <>REGISTRARSE CON {discordLogo}</>,
      userName: 'USUARIO:',
    },
  },
  home: {
    isntEndorsed:
      'EL QUESTO isn’t endorsed by Riot Games and doesn’t reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.',
    theQuest: 'EL QUESTO.',
  },
  masteries: {
    addShard: 'ADAR EL FRAGMENTO',
    filters: {
      all: 'AYYYY',
      level: level => `NIVATO ${level}${level === 10 ? '+' : ''}`,
      order: {
        desc: 'EL GRANDE TO MINO',
        asc: 'EL MINO TO GRANDE',
      },
      nineAndLess: '9 E MINO',
      tenAndMore: '10+',
      sort: {
        level: 'TRIAR PER NIVATO > TOKOS > POINTITOS',
        percents: 'TRIAR PER % > POINTITOS',
        points: 'TRIAR PER POINTITOS',
        name: 'TRIAR PER NOME',
      },
      sortShort: {
        level: 'PTS',
        percents: '%',
        points: 'TITO',
        name: 'JAJA',
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
      masteryChange: (from, to) => `CHANGAR DEL MAITRISO ${nls(from)} à ${nls(to)}`,
      nChangesDetected: n => {
        const s = n < 2 ? '' : 's'
        return (
          <>
            CAMBIO{s} DE NIVEL DETECTADO{s} DESDE LA ÚLTIMA MODIFICACIÓN DEL FRAGMENTO.
            <br />
            ¿QUIZÁ HAYA GASTADO ALGUNOS (FRAGMENTOS)?
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
    nMarksOfMastery: (earned, total) => `${plural('TOKO')(earned)} / ${nls(total)}`,
    points: (points, total, highlightClassName) => (
      <>
        <span className={highlightClassName}>{nls(points)}</span>{' '}
        {total !== undefined ? (
          <>
            / <span className={highlightClassName}>{nls(total)}</span>{' '}
          </>
        ) : null}
        PUNTOS
      </>
    ),
    pointsSinceLastLevel: (points, level) =>
      points < 0
        ? `${plural('POINTITO')(Math.abs(points))} PARA EL NIVOLO ${nls(level)}`
        : `${plural('POINTITO')(points)} DEL NIVELO ${nls(level)}`,
    pointsUntilNextLevel: (points, level) =>
      points < 0
        ? `NIVEL ${nls(level)} SUPERADO EN ${plural('PUNTO')(Math.abs(points))}`
        : `${plural('POINTITO')(points)} PARA EL NIVOLO ${nls(level)}`,
    removeShard: 'DISCALIFIAR EL FRAGMENTO',
    updateShardsSucces: 'FRAGMENTO MODIFIAR',
    updateShardsError: 'PROBLEMO EN EL MODIFICATION DEL FRAGMENTO',
  },
  notFound: {
    home: 'CASA',
    thisPageDoesntExist: 'EL MAESTRO PROBLEMO.',
  },
  register: {
    accessRecentSearches: recentSearches =>
      `VER LAS ${nls(recentSearches)} BÚSQUEDAS MÁS RECIENTES (ALMACENAMIENTO LOCAL DEL NAVEGADOR)`,
    accessSummonerDetails: 'BUSCAR TODOS LOS DATOS DE UN INVOCADOR',
    addSummonerToFavorites: 'AÑADIR INVOCADORES COMO FAVORITOS',
    customiseChampionPositions: 'PERSONALIZAR LOS CAMPEONES ASOCIADOS A UNA FUNCIÓN',
    discordHallOfFameRanking:
      'CLASIFICACIÓN EN EL SALÓN DE LA FAMA DEL SERVIDOR DISCORD DEL CAPITÁN:',
    discordServer: 'SERVIDOR DISCORD',
    discordServerIconAlt: name => `Icône du serveur ${name}`,
    join: 'CONTACTO',
    keepTrackOfShards: 'SEGUIMIENTO DE LOS FRAGMENTOS DE CAMPEONES (A MANO, LO SIENTO)',
    quickSummonerAccess: 'ACCESO RÁPIDO AL PERFIL DE INVOCADOR VINCULADO',
    registrationExplanation: (
      <>
        TENER UNA CUENTA VINCULADA A UNA CUENTA DE DISCORD, QUE A SU VEZ ESTÁ VINCULADA A UNA CUENTA
        DE Riot Games, TE DA ACCESO A ACCESO A MÁS FUNCIONES.
        <br />
        COMO Riot Games ESTÁ TODO PODRIDO, NO ES POSIBLE VINCULAR DIRECTAMENTE UNA CUENTA DE Riot
        Games DIRECTAMENTE. TIENES QUE USAR UNA CUENTA DE DISCORD Y VINCULARLA A UNA CUENTA DE Riot
        Games.
      </>
    ),
    withAccountLinked: 'CON UNA CUENTA VINCULADA A Riot Games',
    withAccountNotLinked: 'CON UNA CUENTA NO VINCULADA A Riot Games',
    withoutAccount: 'SIN CUENTA',
  },
  summoner: {
    masteriesCache: {
      lastUpdate: insertedAt =>
        `ÚLTIMA ACTUALIZACIÓN DE LOS TÍTULOS DE MÁSTER EN ${insertedAt.toLocaleTimeString(locale)}`,
      duration: minutes =>
        `(DURACIÓN DE LA CACHÉ: ${minutes.toLocaleString(locale, {
          maximumFractionDigits: 2,
        })} ${pluralUnit('MINUTO')(minutes)})`,
    },
    masteryScore: 'PUNTUACIÓN DE MAESTRÍA:',
    masteryPoints: 'PUNTOS DE MAESTRÍA:',
    otpIndex: 'ÍNDICE DE OTP:',
    otpIndexExplanation:
      '(NÚMERO DE CAMPEONES QUE ACUMULAN LA MITAD DEL NÚMERO TOTAL DE PUNTOS DE MAESTRÍA)',
    masteriesExplanation: (
      <>
        <li>Nivel de maestría 10 o superior = 100%.</li>
        <li>
          Se necesitan 75.600 puntos para alcanzar el nivel 10 (cuenta para la mitad del cálculo del
          porcentaje)
        </li>
        <li>
          Se necesitan 7 Marcas de Maestría para alcanzar el nivel 10 (cuenta para la otra mitad del
          cálculo)
        </li>
      </>
    ),
    percentsProgression: (percents, highlightClassName) => (
      <>
        PROGRESO: <span className={highlightClassName}>{nls(percents)} %</span>
      </>
    ),
  },
  router: {
    theQuest: 'EL QUESTO',
    game: 'PARTIDO',
    aram: 'ARAMO',
    urf: 'URFO',
    factions: 'FACTIONOS',
    login: 'CONNEXION',
    register: 'INSCRIPTAR',
    notFound: 'PROBLEMO',
  },
}

export default esESTranslation

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
  return (n: number): string => `${unit}${n < 2 ? '' : 'S'}`
}
