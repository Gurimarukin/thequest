import { createEnum } from '../../../utils/createEnum'
import type { Dict } from '../../../utils/fp'

type ChampionFaction = typeof e.T

const e = createEnum(
  'bandle',
  'bilgewater',
  'demacia',
  'freljord',
  'ionia',
  'ixtal',
  'noxus',
  'piltover',
  'shadowIsles',
  'shurima',
  'targon',
  'void',
  'zaun',
)

const label: Dict<ChampionFaction, string> = {
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
}

const ChampionFaction = { ...e, label }

type ChampionFactionOrNone = typeof eOrNone.T

const eOrNone = createEnum(...e.values, 'none')

const orNoneLabel: Dict<ChampionFactionOrNone, string> = {
  ...label,
  none: 'Sans faction',
}

const ChampionFactionOrNone = { ...eOrNone, label: orNoneLabel }

export { ChampionFaction, ChampionFactionOrNone }
