import { createEnum } from '../../utils/createEnum'

type ChampionLevel = typeof e.T

const e = createEnum(1, 2, 3, 4, 5, 6, 7)

const ChampionLevel = { codec: e.codec }

type ChampionLevelOrZero = 0 | ChampionLevel

const values = [0, ...e.values] as const

const stringify = String as (level: ChampionLevelOrZero) => `${ChampionLevelOrZero}`

const ChampionLevelOrZero = { values, stringify }

export { ChampionLevel, ChampionLevelOrZero }
