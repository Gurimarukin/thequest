import { createEnum } from '../../../utils/createEnum'

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

const ChampionFaction = e

type ChampionFactionOrNone = typeof eOrNone.T

const eOrNone = createEnum(...e.values, 'none')

const ChampionFactionOrNone = eOrNone

export { ChampionFaction, ChampionFactionOrNone }
