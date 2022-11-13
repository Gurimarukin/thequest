import * as D from 'io-ts/Decoder'

import { ChampionId } from '../../../shared/models/ChampionId'
import { SummonerId } from '../../../shared/models/SummonerId'

import { DayJsFromNumber } from '../../utils/ioTsUtils'

type ChampionMastery = D.TypeOf<typeof codec>

const codec = D.struct({
  championId: ChampionId.codec,
  championLevel: D.number,
  championPoints: D.number,
  lastPlayTime: DayJsFromNumber.decoder,
  championPointsSinceLastLevel: D.number,
  championPointsUntilNextLevel: D.number,
  chestGranted: D.boolean,
  tokensEarned: D.number,
  summonerId: SummonerId.codec,
})

const ChampionMastery = { codec }

export { ChampionMastery }
