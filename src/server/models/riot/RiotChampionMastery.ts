import * as D from 'io-ts/Decoder'

import { ChampionKey } from '../../../shared/models/api/ChampionKey'
import { ChampionLevel } from '../../../shared/models/api/ChampionLevel'

import { DayJsFromNumber } from '../../utils/ioTsUtils'
import { SummonerId } from '../summoner/SummonerId'

type RiotChampionMastery = D.TypeOf<typeof decoder>

const decoder = D.struct({
  championId: ChampionKey.codec,
  championLevel: ChampionLevel.codec,
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
