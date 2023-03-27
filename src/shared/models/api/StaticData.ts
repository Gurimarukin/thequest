import * as C from 'io-ts/Codec'

import { List } from '../../utils/fp'
import { DDragonVersion } from './DDragonVersion'
import { StaticDataChampion } from './StaticDataChampion'

type StaticData = Readonly<C.TypeOf<typeof codec>>

const codec = C.struct({
  version: DDragonVersion.codec,
  champions: List.codec(StaticDataChampion.codec),
})

const StaticData = { codec }

export { StaticData }
