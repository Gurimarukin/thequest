import type { ChampionFaction } from '../../../shared/models/api/champion/ChampionFaction'
import { createEnum } from '../../../shared/utils/createEnum'
import type { Dict } from '../../../shared/utils/fp'

type WikiChampionFaction = typeof e.T

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
  'Zaun',
)

const faction: Dict<WikiChampionFaction, ChampionFaction> = {
  'Bandle City': 'bandle',
  Bilgewater: 'bilgewater',
  Demacia: 'demacia',
  Freljord: 'freljord',
  Ionia: 'ionia',
  Ixtal: 'ixtal',
  Noxus: 'noxus',
  Piltover: 'piltover',
  'Shadow Isles': 'shadowIsles',
  Shurima: 'shurima',
  Targon: 'targon',
  Void: 'void',
  Zaun: 'zaun',
}

const WikiChampionFaction = { ...e, faction }

export { WikiChampionFaction }
