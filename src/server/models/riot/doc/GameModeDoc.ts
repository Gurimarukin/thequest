import * as D from 'io-ts/Decoder'

type GameModeDoc = D.TypeOf<typeof decoder>

const decoder = D.struct({
  gameMode: D.string,
  // description: D.string,
})

const GameModeDoc = { decoder }

export { GameModeDoc }
