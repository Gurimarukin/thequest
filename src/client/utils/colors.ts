export function masteryBgColor(championLevel: number): string | undefined {
  if (7 <= championLevel) return 'text-mastery-7'
  if (championLevel === 6) return 'text-mastery-6'
  if (championLevel === 5) return 'text-mastery-5'
  if (championLevel === 4) return 'text-mastery-4'
  if (championLevel === 0) return undefined
  return 'text-mastery-3'
}

export function masteryTextColor(championLevel: number): string {
  if (7 <= championLevel) return 'text-mastery-7-text'
  if (championLevel === 6) return 'text-mastery-6-text'
  if (championLevel === 5) return 'text-mastery-5-text'
  if (championLevel === 4) return 'text-mastery-4-text'
  return 'text-mastery-3-text'
}

export function masteryBgGradient(championLevel: number): string | undefined {
  if (7 <= championLevel) return 'bg-gradient-to-r from-mastery-7 to-mastery-7-bis'
  if (championLevel === 6) return 'bg-gradient-to-r from-mastery-6 to-mastery-6-bis'
  if (championLevel === 5) return 'bg-gradient-to-r from-mastery-5 to-mastery-5-bis'
  if (championLevel === 4) return 'bg-gradient-to-r from-mastery-4 to-mastery-4-bis'
  if (championLevel === 0) return undefined
  return 'bg-gradient-to-r from-mastery-3 to-mastery-3-bis'
}
