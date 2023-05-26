import { createEnum } from '../../../utils/createEnum'
import type { Dict, List } from '../../../utils/fp'
import { Tuple } from '../../../utils/fp'

const t: <K extends number>(key: K, value: string) => Tuple<K, string> = Tuple.of

type GameQueue = typeof GameQueue.T

const { struct: label, keys } = structAndKeys(
  t(0, 'Personnalisée'), // Custom games
  t(2, '5v5 Blind Pick'), // Summoner's Rift — 5v5 Blind Pick games — Deprecated in patch 7.19 in favor of queueId 430"
  t(4, '5v5 Ranked Solo'), // Summoner's Rift — 5v5 Ranked Solo games — Deprecated in favor of queueId 420"
  t(6, '5v5 Ranked Premade'), // Summoner's Rift — 5v5 Ranked Premade games — Game mode deprecated"
  t(7, 'Co-op vs AI'), // Summoner's Rift — Co-op vs AI games — Deprecated in favor of queueId 32 and 33"
  t(8, '3v3 Normal'), // Twisted Treeline — 3v3 Normal games — Deprecated in patch 7.19 in favor of queueId 460"
  t(9, '3v3 Ranked Flex'), // Twisted Treeline — 3v3 Ranked Flex games — Deprecated in patch 7.19 in favor of queueId 470"
  t(14, '5v5 Draft Pick'), // Summoner's Rift — 5v5 Draft Pick games — Deprecated in favor of queueId 400"
  t(16, '5v5 Dominion Blind Pick'), // Crystal Scar — 5v5 Dominion Blind Pick games — Game mode deprecated"
  t(17, '5v5 Dominion Draft Pick'), // Crystal Scar — 5v5 Dominion Draft Pick games — Game mode deprecated"
  t(25, 'Dominion Co-op vs AI'), // Crystal Scar — Dominion Co-op vs AI games — Game mode deprecated"
  t(31, 'Co-op vs AI Intro Bot'), // Summoner's Rift — Co-op vs AI Intro Bot games — Deprecated in patch 7.19 in favor of queueId 830"
  t(32, 'Co-op vs AI Beginner Bot'), // Summoner's Rift — Co-op vs AI Beginner Bot games — Deprecated in patch 7.19 in favor of queueId 840"
  t(33, 'Co-op vs AI Intermediate Bot'), // Summoner's Rift — Co-op vs AI Intermediate Bot games — Deprecated in patch 7.19 in favor of queueId 850"
  t(41, '3v3 Ranked Team'), // Twisted Treeline — 3v3 Ranked Team games — Game mode deprecated"
  t(42, '5v5 Ranked Team'), // Summoner's Rift — 5v5 Ranked Team games — Game mode deprecated"
  t(52, 'Co-op vs AI'), // Twisted Treeline — Co-op vs AI games — Deprecated in patch 7.19 in favor of queueId 800"
  t(61, '5v5 Team Builder'), // Summoner's Rift — 5v5 Team Builder games — Game mode deprecated"
  t(65, '5v5 ARAM'), // Howling Abyss — 5v5 ARAM games — Deprecated in patch 7.19 in favor of queueId 450"
  t(67, 'ARAM Co-op vs AI'), // Howling Abyss — ARAM Co-op vs AI games — Game mode deprecated"
  t(70, 'One for All'), // Summoner's Rift — One for All games — Deprecated in patch 8.6 in favor of queueId 1020"
  t(72, 'Snowdown Showdown (1c1)'), // Howling Abyss — 1v1 Snowdown Showdown games
  t(73, 'Snowdown Showdown (2c2)'), // Howling Abyss — 2v2 Snowdown Showdown games
  t(75, 'Hexakill'), // Summoner's Rift — 6v6 Hexakill games
  t(76, 'Ultra Rapid Fire'), // Summoner's Rift — Ultra Rapid Fire games
  t(78, 'Un pour Tous: Mode Miroir'), // Howling Abyss — One For All: Mirror Mode games
  t(83, 'Coop vs IA Ultra Rapid Fire'), // Summoner's Rift — Co-op vs AI Ultra Rapid Fire games
  t(91, 'Doom Bots Rank 1'), // Summoner's Rift — Doom Bots Rank 1 games — Deprecated in patch 7.19 in favor of queueId 950"
  t(92, 'Doom Bots Rank 2'), // Summoner's Rift — Doom Bots Rank 2 games — Deprecated in patch 7.19 in favor of queueId 950"
  t(93, 'Doom Bots Rank 5'), // Summoner's Rift — Doom Bots Rank 5 games — Deprecated in patch 7.19 in favor of queueId 950"
  t(96, 'Ascension'), // Crystal Scar — Ascension games — Deprecated in patch 7.19 in favor of queueId 910"
  t(98, 'Hexakill (Forêt Torturée)'), // Twisted Treeline — 6v6 Hexakill games
  t(100, 'ARAM (Pont du Boucher)'), // Butcher's Bridge — 5v5 ARAM games
  t(300, 'Legend of the Poro King'), // Howling Abyss — Legend of the Poro King games — Deprecated in patch 7.19 in favor of queueId 920"
  t(310, 'Némésis'), // Summoner's Rift — Nemesis games
  t(313, 'Micmac au Marché Noir'), // Summoner's Rift — Black Market Brawlers games
  t(315, 'Nexus Siege'), // Summoner's Rift — Nexus Siege games — Deprecated in patch 7.19 in favor of queueId 940"
  t(317, 'Definitely Not Dominion'), // Crystal Scar — Definitely Not Dominion games
  t(318, 'ARURF'), // Summoner's Rift — ARURF games — Deprecated in patch 7.19 in favor of queueId 900"
  t(325, 'All Random'), // Summoner's Rift — All Random games
  t(400, 'Normale Draft'), // Summoner's Rift — 5v5 Draft Pick games
  t(410, '5v5 Ranked Dynamic'), // Summoner's Rift — 5v5 Ranked Dynamic games — Game mode deprecated in patch 6.22"
  t(420, 'Classée Solo/Duo'), // Summoner's Rift — 5v5 Ranked Solo games
  t(430, 'Normale Aveugle'), // Summoner's Rift — 5v5 Blind Pick games
  t(440, 'Classée FLEXXX'), // Summoner's Rift — 5v5 Ranked Flex games
  t(450, 'ARAM'), // Howling Abyss — 5v5 ARAM games
  t(460, '3v3 Blind Pick'), // Twisted Treeline — 3v3 Blind Pick games — Deprecated in patch 9.23"
  t(470, '3v3 Ranked Flex'), // Twisted Treeline — 3v3 Ranked Flex games — Deprecated in patch 9.23"
  t(600, 'Chasse à la Lune de Sang'), // Summoner's Rift — Blood Hunt Assassin games
  t(610, 'Pulsar Sombre'), // Cosmic Ruins — Dark Star: Singularity games
  t(700, 'Clash'), // Summoner's Rift — Summoner's Rift Clash games
  t(720, 'Clash (ARAM)'), // Howling Abyss — ARAM Clash games
  t(800, 'Co-op vs. AI Intermediate Bot'), // Twisted Treeline — Co-op vs. AI Intermediate Bot games — Deprecated in patch 9.23"
  t(810, 'Co-op vs. AI Intro Bot games'), // Twisted Treeline — Co-op vs. AI Intro Bot games — Deprecated in patch 9.23"
  t(820, 'Coop vs IA Débutant (Forêt Torturée)'), // Twisted Treeline — Co-op vs. AI Beginner Bot games
  t(830, 'Coop vs IA Intro'), // Summoner's Rift — Co-op vs. AI Intro Bot games
  t(840, 'Coop vs IA Débutant'), // Summoner's Rift — Co-op vs. AI Beginner Bot games
  t(850, 'Coop vs IA Intermédiaire'), // Summoner's Rift — Co-op vs. AI Intermediate Bot games
  t(900, 'ARURF'), // Summoner's Rift — ARURF games
  t(910, 'Ascension'), // Crystal Scar — Ascension games
  t(920, 'Légende du Roi Poro'), // Howling Abyss — Legend of the Poro King games
  t(940, 'Siège du Nexus'), // Summoner's Rift — Nexus Siege games
  t(950, 'Bots du Chaos (vote)'), // Summoner's Rift — Doom Bots Voting games
  t(960, 'Bots du Chaos'), // Summoner's Rift — Doom Bots Standard games
  t(980, 'Invasion Normal'), // Valoran City Park — Star Guardian Invasion: Normal games
  t(990, 'Invasion Massacre'), // Valoran City Park — Star Guardian Invasion: Onslaught games
  t(1000, 'PROJET : Chasseurs'), // Overcharge — PROJECT: Hunters games
  t(1010, 'ARURF (Faille Enneigée)'), // Summoner's Rift — Snow ARURF games
  t(1020, 'Un Pour Tous'), // Summoner's Rift — One for All games
  t(1030, 'Odyssée Extraction Intro'), // Crash Site — Odyssey Extraction: Intro games
  t(1040, 'Odyssée Extraction Cadet'), // Crash Site — Odyssey Extraction: Cadet games
  t(1050, 'Odyssée Extraction Membre d’Équipage'), // Crash Site — Odyssey Extraction: Crewmember games
  t(1060, 'Odyssée Extraction Capitaine'), // Crash Site — Odyssey Extraction: Captain games
  t(1070, 'Odyssée Extraction Massacre'), // Crash Site — Odyssey Extraction: Onslaught games
  t(1090, 'TFT'), // Convergence — Teamfight Tactics games
  t(1100, 'Classée TFT'), // Convergence — Ranked Teamfight Tactics games
  t(1110, 'TFT Tutoriel'), // Convergence — Teamfight Tactics Tutorial games
  t(1111, 'TFT test'), // Convergence — Teamfight Tactics test games
  t(1200, 'Nexus Blitz'), // Nexus Blitz — Nexus Blitz games — Deprecated in patch 9.2"
  t(1300, 'Raid du Nexus'), // Nexus Blitz — Nexus Blitz games
  t(1400, 'Grimoire Ultime'), // Summoner's Rift — Ultimate Spellbook games
  t(1900, 'Pick URF'), // Summoner's Rift — Pick URF games
  t(2000, 'Tutoriel 1'), // Summoner's Rift — Tutorial 1
  t(2010, 'Tutoriel 2'), // Summoner's Rift — Tutorial 2
  t(2020, 'Tutoriel 3'), // Summoner's Rift — Tutorial 3
)

const e = createEnum(...keys)

const GameQueue = { ...e, label }

export { GameQueue }

function structAndKeys<A extends List<Tuple<number, string>>>(
  ...entries: A
): {
  struct: Dict<`${A[number][0]}`, string>
  keys: {
    [K in keyof A]: A[K][0]
  }
} {
  return {
    struct: Object.fromEntries(entries) as Dict<`${A[number][0]}`, string>,
    keys: entries.map(Tuple.fst) as {
      [K in keyof A]: A[K][0]
    },
  }
}
