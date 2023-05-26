import * as D from 'io-ts/Decoder'

import { DDragonSummoner } from './DDragonSummoner'

type DDragonSummoners = D.TypeOf<typeof decoder>

const decoder = D.struct({
  // type: D.literal('summoner'),
  // version: DDragonVersion.codec,
  data: D.record(DDragonSummoner.decoder),
})

const DDragonSummoners = { decoder }

export { DDragonSummoners }
