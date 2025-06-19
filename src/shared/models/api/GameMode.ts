import { createEnum } from '../../utils/createEnum'

type GameMode = typeof GameMode.T

const GameMode = createEnum(
  'CLASSIC', // Classic Summoner's Rift and Twisted Treeline games
  'ODIN', // Dominion/Crystal Scar games
  'ARAM', // ARAM games
  'TUTORIAL', // Tutorial games
  'URF', // URF games
  'DOOMBOTSTEEMO', // Doom Bot games
  'ONEFORALL', // One for All games
  'ASCENSION', // Ascension games
  'FIRSTBLOOD', // Snowdown Showdown games
  'KINGPORO', // Legend of the Poro King games
  'SIEGE', // Nexus Siege games
  'ASSASSINATE', // Blood Hunt Assassin games
  'ARSR', // All Random Summoner's Rift games
  'DARKSTAR', // Dark Star: Singularity games
  'STARGUARDIAN', // Star Guardian Invasion games
  'PROJECT', // PROJECT: Hunters games
  'GAMEMODEX', // Nexus Blitz games
  'ODYSSEY', // Odyssey: Extraction games
  'NEXUSBLITZ', // Nexus Blitz games
  'ULTBOOK', // Ultimate Spellbook games
  'CHERRY', // Arena
  'SWIFTPLAY', // Swiftplay
  'BRAWL',
)

export { GameMode }
