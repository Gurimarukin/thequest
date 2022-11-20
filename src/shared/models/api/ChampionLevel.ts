import { createEnum } from '../../utils/createEnum'
import type { List } from '../../utils/fp'

type ChampionLevel = typeof e.T

const e = createEnum(1, 2, 3, 4, 5, 6, 7)

const ChampionLevel = { codec: e.codec }

type ChampionLevelOrZero = 0 | ChampionLevel

const values: List<ChampionLevelOrZero> = [0, ...e.values]

const stringify = String as (level: ChampionLevelOrZero) => `${ChampionLevelOrZero}`

const ChampionLevelOrZero = { values, stringify }

export { ChampionLevel, ChampionLevelOrZero }
