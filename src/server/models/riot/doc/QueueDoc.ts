import * as D from 'io-ts/Decoder'

type QueueDoc = D.TypeOf<typeof decoder>

const decoder = D.struct({
  queueId: D.number,
  // map: D.string,
  // description: Maybe.decoder(D.string),
  // notes: Maybe.decoder(D.string),
})

const QueueDoc = { decoder }

export { QueueDoc }
