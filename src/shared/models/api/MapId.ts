import { createEnum } from '../../utils/createEnum'
import { List } from '../../utils/fp'

type MapId = typeof e.T

type SummonersRiftMap = (typeof summonersRiftMaps)[number]

const summonersRiftMaps = [
  1, // Summoner's Rift — Original Summer variant
  2, // Summoner's Rift — Original Autumn variant
  11, // Summoner's Rift — Current Version
] as const

const e = createEnum(
  ...summonersRiftMaps,
  3, // The Proving Grounds — Tutorial Map
  4, // Twisted Treeline — Original Version
  8, // The Crystal Scar — Dominion map
  10, // Twisted Treeline — Last TT map
  12, // Howling Abyss — ARAM map
  14, // Butcher's Bridge — Alternate ARAM map
  16, // Cosmic Ruins — Dark Star: Singularity map
  18, // Valoran City Park — Star Guardian Invasion map
  19, // Substructure 43 — PROJECT: Hunters map
  20, // Crash Site — Odyssey: Extraction map
  21, // Nexus Blitz — Nexus Blitz map
  22, // Convergence — Teamfight Tactics map
  30, // Rings of Wrath — Arena map
  35, // The Bandlewood — Brawl map
)

const isSummonersRift = (map: MapId): map is SummonersRiftMap =>
  List.elem(e.Eq)(map, summonersRiftMaps)

const MapId = { ...e, isSummonersRift }

export { MapId }
