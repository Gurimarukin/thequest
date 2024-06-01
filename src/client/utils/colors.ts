const masteryBgColorClassName = {
  10: 'text-[#b71d3c]',
  9: 'text-[#d2651b]',
  8: 'text-[#8d12c9]',
  7: 'text-[#0369a1]',
  6: 'text-[#329055]',
  5: 'text-[#94a3b8]',
  4: 'text-[#71717a]',
  3: 'text-[#71717a]',
  2: 'text-[#71717a]',
  1: 'text-[#71717a]',
} as Record<number, string>

const masteryBgGradientClassName = {
  10: 'bg-gradient-to-r from-[#b71d3c] to-[#640411]',
  9: 'bg-gradient-to-r from-[#d2651b] to-[#8e3d25]',
  8: 'bg-gradient-to-r from-[#8d12c9] to-[#560292]',
  7: 'bg-gradient-to-r from-[#0369a1] to-[#324bd0]',
  6: 'bg-gradient-to-r from-[#329055] to-[#266846]',
  5: 'bg-gradient-to-r from-[#94a3b8] to-[#475569]',
  4: 'bg-gradient-to-r from-[#71717a] to-[#52525b]',
  3: 'bg-gradient-to-r from-[#71717a] to-[#52525b]',
  2: 'bg-gradient-to-r from-[#71717a] to-[#52525b]',
  1: 'bg-gradient-to-r from-[#71717a] to-[#52525b]',
} as Record<number, string>

const masteryTextColorClassName = {
  10: 'text-[#f5378e]',
  9: 'text-[#f6a738]',
  8: 'text-[#e752fb]',
  7: 'text-[#3b82f6]',
  6: 'text-[#22c55e]',
  5: 'text-[#cbd5e1]',
} as Record<number, string>
const masteryTextColorDefaultClassName = 'text-[#d4d4d4]'

const masteryRulerColorClassName = {
  8: 'border-grey-500',
  7: 'border-grey-500',
} as Record<number, string>
const masteryRulerColorDefaultClassName = 'border-grey-400'

export function masteryBgColor(championLevel: number): string | undefined {
  if (championLevel === 0) return undefined

  const res = masteryBgColorClassName[Math.min(championLevel, 10)]

  if (res === undefined) {
    // eslint-disable-next-line functional/no-throw-statements
    throw Error(`masteryBgColor: unknown championLevel ${championLevel}`)
  }

  return res
}

export function masteryBgGradient(championLevel: number): string | undefined {
  if (championLevel === 0) return undefined

  const res = masteryBgGradientClassName[Math.min(championLevel, 10)]

  if (res === undefined) {
    // eslint-disable-next-line functional/no-throw-statements
    throw Error(`masteryBgGradient: unknown championLevel ${championLevel}`)
  }

  return res
}

export function masteryTextColor(championLevel: number): string {
  return masteryTextColorClassName[Math.min(championLevel, 10)] ?? masteryTextColorDefaultClassName
}
export function masteryRulerColor(championLevel: number): string {
  return (
    masteryRulerColorClassName[Math.min(championLevel, 10)] ?? masteryRulerColorDefaultClassName
  )
}
