import { createEnum } from '../../../shared/utils/createEnum'

type WikiaChampionFaction = typeof e.T

const e = createEnum(
  'Bandle City',
  'Bilgewater',
  'Demacia',
  'Freljord',
  'Ionia',
  'Ixtal',
  'Noxus',
  'Piltover',
  'Shadow Isles',
  'Shurima',
  'Targon',
  'Void',
)

const WikiaChampionFaction = e

export { WikiaChampionFaction }
