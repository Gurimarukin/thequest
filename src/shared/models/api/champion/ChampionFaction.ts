import type { Ord } from 'fp-ts/Ord'
import { pipe } from 'fp-ts/function'

import { createEnum } from '../../../utils/createEnum'
import { List } from '../../../utils/fp'

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

// sortBy, but always with 'none' as last
const valuesSortBy = (ords: List<Ord<ChampionFaction>>): List<ChampionFactionOrNone> =>
  pipe(ChampionFaction.values, List.sortBy(ords), List.append<ChampionFactionOrNone>('none'))

const ChampionFactionOrNone = { ...eOrNone, valuesSortBy }

export { ChampionFaction, ChampionFactionOrNone }
