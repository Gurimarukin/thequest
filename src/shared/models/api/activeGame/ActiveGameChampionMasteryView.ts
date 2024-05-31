import * as C from 'io-ts/Codec'

type ActiveGameChampionMasteryView = C.TypeOf<typeof codec>

const codec = C.struct({
  championLevel: C.number,
  championPoints: C.number,
  championPointsSinceLastLevel: C.number,
  championPointsUntilNextLevel: C.number,
  tokensEarned: C.number,
  markRequiredForNextLevel: C.number,
})

const ActiveGameChampionMasteryView = { codec }

export { ActiveGameChampionMasteryView }
