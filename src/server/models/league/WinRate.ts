type WinRate = {
  percents: number
  played: number
}

type WinsLosses = {
  wins: number
  losses: number
}

const toWinsLosses = ({ percents, played }: WinRate): WinsLosses => {
  const wins = Math.round((percents * played) / 100)
  return { wins, losses: played - wins }
}

const WinRate = { toWinsLosses }

export { WinRate }
