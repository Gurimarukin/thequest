const masteryBgColorClassName = {
  10: 'text-[#B71D3C]',
  9: 'text-[#d2651b]',
  8: 'text-[#8d12c9]',
  // 7: 'text-mastery-7',
  // 7: 'text-[#6FAEDC]',
  7: 'text-[#0369a1]',
  6: 'text-[#329055]',
  5: 'text-[#94a3b8]',
  4: 'text-mastery-3',
  3: 'text-mastery-3',
  2: 'text-mastery-3',
  1: 'text-mastery-3',
} as Record<number, string>

const masteryBgGradientClassName = {
  // 10: 'bg-gradient-to-r from-[#7d2328] to-[#d72c66]',
  // 10: 'bg-gradient-to-r from-[#D62C66] to-[#862329]',
  10: 'bg-gradient-to-r from-[#B71D3C] to-[#640411]',
  // 9: 'bg-gradient-to-r from-[#E9701F] to-[#8E3D25]',
  9: 'bg-gradient-to-r from-[#d2651b] to-[#8E3D25]',
  // 8: 'bg-gradient-to-r from-[#DB54EA] to-[#892BDC]',
  // 8: 'bg-gradient-to-r from-[#6946E1] to-[#592B60]',
  // 8: 'bg-gradient-to-r from-[#9D14DF] to-[#560292]',
  8: 'bg-gradient-to-r from-[#8d12c9] to-[#560292]',
  // 7: 'bg-gradient-to-r from-[#85B8F5] to-[#4955D0]',
  // 7: 'bg-gradient-to-r from-[#4955D0] to-[#324BD0]',
  7: 'bg-gradient-to-r from-[#0369a1] to-[#324BD0]',
  // 7: 'bg-gradient-to-r from-mastery-7 to-mastery-7-bis',
  // 7: 'bg-gradient-to-r from-mastery-7 to-mastery-7-bis',
  // 6: 'bg-gradient-to-r from-[#38A05F] to-[#266846]',
  // 6: 'bg-gradient-to-r from-[#266846] to-[#52CE81]',
  6: 'bg-gradient-to-r from-[#329055] to-[#266846]',
  // 5: 'bg-gradient-to-r from-[#A1B6BF] to-[#556184]',
  // 5: 'bg-gradient-to-r from-[#6395D2] to-[#556184]',
  // 5: 'bg-gradient-to-r from-[#6390CC]/80 to-[#556184]',
  // 5: 'bg-gradient-to-r from-[#6395D2] to-[#4f73a3]',
  5: 'bg-gradient-to-r from-[#94a3b8] to-[#475569]',
  4: 'bg-gradient-to-r from-mastery-3 to-mastery-3-bis',
  3: 'bg-gradient-to-r from-mastery-3 to-mastery-3-bis',
  2: 'bg-gradient-to-r from-mastery-3 to-mastery-3-bis',
  1: 'bg-gradient-to-r from-mastery-3 to-mastery-3-bis',
} as Record<number, string>

// if (level === 7) return 'bg-gradient-to-r from-mastery-7 to-mastery-7-bis'
// if (level === 6) return 'bg-gradient-to-r from-mastery-6 to-mastery-6-bis'
// if (level === 5) return 'bg-gradient-to-r from-mastery-5 to-mastery-5-bis'
// if (level === 4) return 'bg-gradient-to-r from-mastery-4 to-mastery-4-bis'
// if (level === 0) return undefined
// return 'bg-gradient-to-r from-mastery-3 to-mastery-3-bis'

const masteryTextColorClassName = {
  // 10: 'text-mastery-5-text',
  10: 'text-[#F5378E]',
  // 9: 'text-[#d2651b]',
  9: 'text-[#F6A738]',
  8: 'text-[#E752FB]',
  // 7: 'text-mastery-7-text',
  // 7: 'text-[#6FAEDC]',
  // 7: 'text-[#0A7DD0]',
  // 7: 'text-[#2a8dd5]',
  // 7: 'text-[#3b82f6]',
  7: 'text-[#3b82f6]',
  // 6: 'text-[#38A05F]',
  6: 'text-[#22c55e]',
  5: 'text-[#cbd5e1]',
  // 4: 'text-mastery-4-text',
} as Record<number, string>
const masteryTextColorDefaultClassName = 'text-mastery-3-text'

const masteryRulerColorClassName = {
  8: 'border-grey-500',
  7: 'border-grey-500',
} as Record<number, string>
const masteryRulerColorDefaultClassName = 'border-grey-400'

//

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
