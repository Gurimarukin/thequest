const round = (n: number, digits = 0): number => {
  const e = 10 ** digits
  return Math.round(n * e) / e
}

export const NumberUtils = { round }
