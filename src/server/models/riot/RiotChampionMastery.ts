import * as D from 'io-ts/Decoder'

import { ChampionKey } from '../../../shared/models/api/ChampionKey'
import { SummonerId } from '../../../shared/models/api/SummonerId'

import { DayJsFromNumber } from '../../../client/utils/ioTsUtils'

type RiotChampionMastery = D.TypeOf<typeof decoder>

const decoder = D.struct({
  championId: ChampionKey.codec,
  championLevel: D.number,
  championPoints: D.number,
  lastPlayTime: DayJsFromNumber.decoder,
  championPointsSinceLastLevel: D.number,
  championPointsUntilNextLevel: D.number,
  chestGranted: D.boolean,
  tokensEarned: D.number,
  summonerId: SummonerId.codec,
})

const RiotChampionMastery = { decoder }

export { RiotChampionMastery }
