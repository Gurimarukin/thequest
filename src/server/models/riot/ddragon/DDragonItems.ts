import * as D from 'io-ts/Decoder'

import { DDragonItem } from './DDragonItem'

type DDragonItems = D.TypeOf<typeof decoder>

const decoder = D.struct({
  // type: D.literal('item'),
  // version: DDragonVersion.codec,
  data: D.record(DDragonItem.decoder),
  // groups: ...
  // tree: ...
})

const DDragonItems = { decoder }

export { DDragonItems }
