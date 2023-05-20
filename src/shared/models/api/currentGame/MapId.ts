import { createEnum } from '../../../utils/createEnum'
import type { Dict } from '../../../utils/fp'

type MapId = typeof MapId.T

const MapId = createEnum(
  1, // Summoner's Rift — Original Summer variant
  2, // Summoner's Rift — Original Autumn variant
  3, // The Proving Grounds — Tutorial Map
  4, // Twisted Treeline — Original Version
  8, // The Crystal Scar — Dominion map
  10, // Twisted Treeline — Last TT map
  11, // Summoner's Rift — Current Version
  12, // Howling Abyss — ARAM map
  14, // Butcher's Bridge — Alternate ARAM map
  16, // Cosmic Ruins — Dark Star: Singularity map
  18, // Valoran City Park — Star Guardian Invasion map
  19, // Substructure 43 — PROJECT: Hunters map
  20, // Crash Site — Odyssey: Extraction map
  21, // Nexus Blitz — Nexus Blitz map
  22, // Convergence — Teamfight Tactics map
)

const label: Dict<`${MapId}`, string> = {
  1: 'Faille de l’invocateur', // Summoner's Rift
  2: 'Faille de l’invocateur', // Summoner's Rift
  3: 'The Proving Grounds', // The Proving Grounds
  4: 'Forêt torturée', // Twisted Treeline
  8: 'La Brêche de Cristal', // The Crystal Scar
  10: 'Forêt torturée', // Twisted Treeline
  11: 'Faille de l’invocateur', // Summoner's Rift
  12: 'Abîme Hurlant', // Howling Abyss
  14: 'Le Pont du Boucher', // Butcher's Bridge
  16: 'Cosmic Ruins', // Cosmic Ruins
  18: 'Valoran City Park', // Valoran City Park
  19: 'Substructure 43', // Substructure 43
  20: 'Crash Site', // Crash Site
  21: 'Nexus Blitz', // Nexus Blitz
  22: 'Convergence', // Convergence
}

export { MapId, label }
