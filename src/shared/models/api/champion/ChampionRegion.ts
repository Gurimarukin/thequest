import { createEnum } from '../../../utils/createEnum'

type ChampionRegion = typeof ChampionRegion.T

const ChampionRegion = createEnum(
  'Bandle',
  'Bilgewater',
  'Demacia',
  'Freljord',
  'Ionia',
  'Ixtal',
  'Le Néant',
  'Les Îles Obscures',
  'Noxus',
  'Piltover',
  'Shurima',
  'Targon',
  'Zaun',
)

export { ChampionRegion }
