import { createEnum } from '../../../utils/createEnum'

type GameQueue = typeof GameQueue.T

const e = createEnum(
  0, // Custom games
  2, // Summoner's Rift — 5v5 Blind Pick games — Deprecated in patch 7.19 in favor of queueId 430"
  4, // Summoner's Rift — 5v5 Ranked Solo games — Deprecated in favor of queueId 420"
  6, // Summoner's Rift — 5v5 Ranked Premade games — Game mode deprecated"
  7, // Summoner's Rift — Co-op vs AI games — Deprecated in favor of queueId 32 and 33"
  8, // Twisted Treeline — 3v3 Normal games — Deprecated in patch 7.19 in favor of queueId 460"
  9, // Twisted Treeline — 3v3 Ranked Flex games — Deprecated in patch 7.19 in favor of queueId 470"
  14, // Summoner's Rift — 5v5 Draft Pick games — Deprecated in favor of queueId 400"
  16, // Crystal Scar — 5v5 Dominion Blind Pick games — Game mode deprecated"
  17, // Crystal Scar — 5v5 Dominion Draft Pick games — Game mode deprecated"
  25, // Crystal Scar — Dominion Co-op vs AI games — Game mode deprecated"
  31, // Summoner's Rift — Co-op vs AI Intro Bot games — Deprecated in patch 7.19 in favor of queueId 830"
  32, // Summoner's Rift — Co-op vs AI Beginner Bot games — Deprecated in patch 7.19 in favor of queueId 840"
  33, // Summoner's Rift — Co-op vs AI Intermediate Bot games — Deprecated in patch 7.19 in favor of queueId 850"
  41, // Twisted Treeline — 3v3 Ranked Team games — Game mode deprecated"
  42, // Summoner's Rift — 5v5 Ranked Team games — Game mode deprecated"
  52, // Twisted Treeline — Co-op vs AI games — Deprecated in patch 7.19 in favor of queueId 800"
  61, // Summoner's Rift — 5v5 Team Builder games — Game mode deprecated"
  65, // Howling Abyss — 5v5 ARAM games — Deprecated in patch 7.19 in favor of queueId 450"
  67, // Howling Abyss — ARAM Co-op vs AI games — Game mode deprecated"
  70, // Summoner's Rift — One for All games — Deprecated in patch 8.6 in favor of queueId 1020"
  72, // Howling Abyss — 1v1 Snowdown Showdown games
  73, // Howling Abyss — 2v2 Snowdown Showdown games
  75, // Summoner's Rift — 6v6 Hexakill games
  76, // Summoner's Rift — Ultra Rapid Fire games
  78, // Howling Abyss — One For All: Mirror Mode games
  83, // Summoner's Rift — Co-op vs AI Ultra Rapid Fire games
  91, // Summoner's Rift — Doom Bots Rank 1 games — Deprecated in patch 7.19 in favor of queueId 950"
  92, // Summoner's Rift — Doom Bots Rank 2 games — Deprecated in patch 7.19 in favor of queueId 950"
  93, // Summoner's Rift — Doom Bots Rank 5 games — Deprecated in patch 7.19 in favor of queueId 950"
  96, // Crystal Scar — Ascension games — Deprecated in patch 7.19 in favor of queueId 910"
  98, // Twisted Treeline — 6v6 Hexakill games
  100, // Butcher's Bridge — 5v5 ARAM games
  300, // Howling Abyss — Legend of the Poro King games — Deprecated in patch 7.19 in favor of queueId 920"
  310, // Summoner's Rift — Nemesis games
  313, // Summoner's Rift — Black Market Brawlers games
  315, // Summoner's Rift — Nexus Siege games — Deprecated in patch 7.19 in favor of queueId 940"
  317, // Crystal Scar — Definitely Not Dominion games
  318, // Summoner's Rift — ARURF games — Deprecated in patch 7.19 in favor of queueId 900"
  325, // Summoner's Rift — All Random games
  400, // Summoner's Rift — 5v5 Draft Pick games
  410, // Summoner's Rift — 5v5 Ranked Dynamic games — Game mode deprecated in patch 6.22"
  420, // Summoner's Rift — 5v5 Ranked Solo games
  430, // Summoner's Rift — 5v5 Blind Pick games
  440, // Summoner's Rift — 5v5 Ranked Flex games
  450, // Howling Abyss — 5v5 ARAM games
  460, // Twisted Treeline — 3v3 Blind Pick games — Deprecated in patch 9.23"
  470, // Twisted Treeline — 3v3 Ranked Flex games — Deprecated in patch 9.23"
  480, // Swiftplay
  490, // Summoner's Rift — Normal (Quickplay)
  600, // Summoner's Rift — Blood Hunt Assassin games
  610, // Cosmic Ruins — Dark Star: Singularity games
  700, // Summoner's Rift — Summoner's Rift Clash games
  720, // Howling Abyss — ARAM Clash games
  800, // Twisted Treeline — Co-op vs. AI Intermediate Bot games — Deprecated in patch 9.23"
  810, // Twisted Treeline — Co-op vs. AI Intro Bot games — Deprecated in patch 9.23"
  820, // Twisted Treeline — Co-op vs. AI Beginner Bot games
  830, // Summoner's Rift — Co-op vs. AI Intro Bot games — Deprecated in March 2024 in favor of queueId 870
  840, // Summoner's Rift — Co-op vs. AI Beginner Bot games — Deprecated in March 2024 in favor of queueId 880
  850, // Summoner's Rift — Co-op vs. AI Intermediate Bot games — Deprecated in March 2024 in favor of queueId 890
  870, // Summoner's Rift — Co-op vs. AI Intro Bot games
  880, // Summoner's Rift — Co-op vs. AI Beginner Bot games
  890, // Summoner's Rift — Co-op vs. AI Intermediate Bot games
  900, // Summoner's Rift — ARURF games
  910, // Crystal Scar — Ascension games
  920, // Howling Abyss — Legend of the Poro King games
  940, // Summoner's Rift — Nexus Siege games
  950, // Summoner's Rift — Doom Bots Voting games
  960, // Summoner's Rift — Doom Bots Standard games
  980, // Valoran City Park — Star Guardian Invasion: Normal games
  990, // Valoran City Park — Star Guardian Invasion: Onslaught games
  1000, // Overcharge — PROJECT: Hunters games
  1010, // Summoner's Rift — Snow ARURF games
  1020, // Summoner's Rift — One for All games
  1030, // Crash Site — Odyssey Extraction: Intro games
  1040, // Crash Site — Odyssey Extraction: Cadet games
  1050, // Crash Site — Odyssey Extraction: Crewmember games
  1060, // Crash Site — Odyssey Extraction: Captain games
  1070, // Crash Site — Odyssey Extraction: Onslaught games
  1090, // Convergence — Teamfight Tactics games
  1100, // Convergence — Ranked Teamfight Tactics games
  1110, // Convergence — Teamfight Tactics Tutorial games
  1111, // Convergence — Teamfight Tactics test games
  1200, // Nexus Blitz — Nexus Blitz games — Deprecated in patch 9.2"
  1210, // Convergence — Teamfight Tactics Choncc's Treasure Mode
  1300, // Nexus Blitz — Nexus Blitz games
  1400, // Summoner's Rift — Ultimate Spellbook games
  1700, // Rings of Wrath — Arena
  1710, // Rings of Wrath — Arena
  1810, // Swarm — Swarm Mode Games
  1820, // Swarm Mode Games — Swarm
  1830, // Swarm Mode Games — Swarm
  1840, // Swarm Mode Games — Swarm
  1900, // Summoner's Rift — Pick URF games
  2000, // Summoner's Rift — Tutorial 1
  2010, // Summoner's Rift — Tutorial 2
  2020, // Summoner's Rift — Tutorial 3
  2300, // The Bandlewood — Brawl map
)

const GameQueue = e

export { GameQueue }
