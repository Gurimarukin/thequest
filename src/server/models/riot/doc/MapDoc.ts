import * as D from 'io-ts/Decoder'

type MapDoc = D.TypeOf<typeof decoder>

const decoder = D.struct({
  mapId: D.number,
  // mapName: D.string,
  // notes: D.string,
})

const MapDoc = { decoder }

export { MapDoc }
