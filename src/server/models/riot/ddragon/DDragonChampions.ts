import * as D from 'io-ts/Decoder'

import { DDragonChampion } from './DDragonChampion'

type DDragonChampions = D.TypeOf<typeof decoder>

const decoder = D.struct({
  type: D.literal('champion'),
  format: D.literal('standAloneComplex'),
  version: D.string,
  data: D.record(DDragonChampion.decoder),
})

const DDragonChampions = { decoder }

export { DDragonChampions }
