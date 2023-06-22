import { createEnum } from '../../../utils/createEnum'

type ChampionFaction = typeof e.T

const e = createEnum(
  'bandleCity',
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

export { ChampionFaction }
