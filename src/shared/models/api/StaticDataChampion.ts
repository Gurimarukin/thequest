import * as C from 'io-ts/Codec'

import { List } from '../../utils/fp'
import { Lane } from './Lane'
import { ChampionId } from './champion/ChampionId'
import { ChampionKey } from './champion/ChampionKey'

type StaticDataChampion = C.TypeOf<typeof codec>

const codec = C.struct({
  id: ChampionId.codec,
  key: ChampionKey.codec,
  name: C.string,
  lanes: List.codec(Lane.codec),
})

const StaticDataChampion = { codec }

export { StaticDataChampion }
