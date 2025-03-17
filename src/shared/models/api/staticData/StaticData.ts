import * as C from 'io-ts/Codec'

import { List, Maybe, NonEmptyArray } from '../../../utils/fp'
import { DDragonVersion } from '../DDragonVersion'
import { StaticDataChampion } from './StaticDataChampion'

type StaticData = C.TypeOf<typeof codec>

const codec = C.struct({
  version: DDragonVersion.codec,
  champions: List.codec(StaticDataChampion.codec),
  docErrors: Maybe.codec(NonEmptyArray.codec(C.string)),
})

const StaticData = { codec }

export { StaticData }
