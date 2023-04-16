import * as C from 'io-ts/Codec'

import { List, Maybe } from '../../utils/fp'
import { WikiaStatsBalance } from '../wikia/WikiaStatsBalance'
import { ChampionId } from './champion/ChampionId'
import { ChampionKey } from './champion/ChampionKey'
import { ChampionPosition } from './champion/ChampionPosition'

type StaticDataChampion = C.TypeOf<typeof codec>

const codec = C.struct({
  id: ChampionId.codec,
  key: ChampionKey.codec,
  name: C.string,
  positions: List.codec(ChampionPosition.codec),
  aram: C.struct({
    stats: Maybe.codec(WikiaStatsBalance.codec),
  }),
})

const StaticDataChampion = { codec }

export { StaticDataChampion }
