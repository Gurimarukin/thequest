import type { Except } from 'type-fest'

import type { ChampionLevel } from '../../shared/models/api/champion/ChampionLevel'
import type { Dict, PartialDict } from '../../shared/utils/fp'

type LevelClassNames = Dict<`${ChampionLevel}`, string>
type LevelExcept0ClassNames = Except<LevelClassNames, '0'>

const masteryBgColorClassName = {
  10: 'text-[#fdf2fc]',
  9: 'text-[#d2651b]',
  8: 'text-[#8d12c9]',
  7: 'text-[#0369a1]',
  6: 'text-[#329055]',
  5: 'text-[#94a3b8]',
  4: 'text-[#71717a]',
  3: 'text-[#71717a]',
  2: 'text-[#71717a]',
  1: 'text-[#71717a]',
} satisfies LevelExcept0ClassNames

const masterySquareBorderGradients: PartialDict<`${ChampionLevel}`, React.ReactElement> = {
  10: (
    <defs>
      <linearGradient id="linear" x1="1" y1="0" x2="0" y2="0">
        <stop offset="30%" stopColor="#f3eafb" />
        <stop offset="55%" stopColor="#fffad8" />
        <stop offset="80%" stopColor="#c8fdfc" />
      </linearGradient>
    </defs>
  ),
}

// Define some `text-...` for `<ChampionTooltip />` better contrast (default: black)
const masteryHistogramGradientClassName = {
  10: 'bg-gradient-to-br from-[#f3eafb] from-30% via-[#fffad8] to-[#c8fdfc] to-80% text-black',
  9: 'bg-gradient-to-r from-[#d2651b] to-[#8e3d25] text-shadow',
  8: 'bg-gradient-to-r from-[#8d12c9] to-[#560292] text-shadow',
  7: 'bg-gradient-to-r from-[#0369a1] to-[#324bd0] text-shadow',
  6: 'bg-gradient-to-r from-[#329055] to-[#266846] text-shadow',
  5: 'bg-gradient-to-r from-[#94a3b8] to-[#475569] text-shadow',
  4: 'bg-gradient-to-r from-[#71717a] to-[#52525b] text-shadow',
  3: 'bg-gradient-to-r from-[#71717a] to-[#52525b] text-shadow',
  2: 'bg-gradient-to-r from-[#71717a] to-[#52525b] text-shadow',
  1: 'bg-gradient-to-r from-[#71717a] to-[#52525b] text-shadow',
} satisfies LevelExcept0ClassNames

// Need iife for Tailwind extension to work ✨
const masteryTextColorClassName = ((): Partial<LevelClassNames> => {
  const className = {
    10: 'text-[#f3eafb]',
    9: 'text-[#f6a738]',
    8: 'text-[#e752fb]',
    7: 'text-[#3b82f6]',
    6: 'text-[#22c55e]',
    5: 'text-[#cbd5e1]',
  }
  return className
})()
const masteryTextColorDefaultClassName = 'text-[#d4d4d4]'

const masteryRulerColorClassName = ((): Partial<LevelClassNames> => {
  const className = {
    10: 'border-grey-500',
    8: 'border-grey-500',
    7: 'border-grey-500',
  }
  return className
})()
const masteryRulerColorDefaultClassName = 'border-grey-400'

export function masteryBgColor(championLevel: number): string | undefined {
  const level = clampChampionLevel(championLevel)

  if (level === 0) return undefined

  return masteryBgColorClassName[level]
}

export function masterySquareBorderGradient(championLevel: number): React.ReactElement | undefined {
  return masterySquareBorderGradients[clampChampionLevel(championLevel)]
}

export function masteryHistogramGradient(championLevel: number): string | undefined {
  const level = clampChampionLevel(championLevel)

  if (level === 0) return undefined

  return masteryHistogramGradientClassName[level]
}

export function masteryTextColor(championLevel: number): string {
  return (
    masteryTextColorClassName[clampChampionLevel(championLevel)] ?? masteryTextColorDefaultClassName
  )
}

export function masteryRulerColor(championLevel: number): string {
  return (
    masteryRulerColorClassName[clampChampionLevel(championLevel)] ??
    masteryRulerColorDefaultClassName
  )
}

/**
 * @param championLevel Should be >= 0
 */
function clampChampionLevel(championLevel: number): ChampionLevel {
  return Math.min(championLevel, 10) as ChampionLevel
}
