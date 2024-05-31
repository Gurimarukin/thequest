import * as D from 'io-ts/Decoder'

import { ChampionKey } from '../../../shared/models/api/champion/ChampionKey'

import { DayJsFromNumber } from '../../utils/ioTsUtils'

type RiotChampionMastery = D.TypeOf<typeof decoder>

const decoder = D.struct({
  // puuid: Puuid.codec,
  championId: ChampionKey.codec,
  championLevel: D.number,
  championPoints: D.number,
  lastPlayTime: DayJsFromNumber.decoder,
  championPointsSinceLastLevel: D.number,
  championPointsUntilNextLevel: D.number,
  tokensEarned: D.number,
  markRequiredForNextLevel: D.number,
})

const RiotChampionMastery = { decoder }

export { RiotChampionMastery }
