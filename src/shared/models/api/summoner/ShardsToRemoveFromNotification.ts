import * as C from 'io-ts/Codec'

type ShardsToRemoveFromNotification = C.TypeOf<typeof codec>

const codec = C.struct({
  leveledUpFrom: C.number, // champion level
  shardsToRemove: C.number,
})

const ShardsToRemoveFromNotification = { codec }

export { ShardsToRemoveFromNotification }
