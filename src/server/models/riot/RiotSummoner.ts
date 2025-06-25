import * as D from 'io-ts/Decoder'

import { Puuid } from '../../../shared/models/api/summoner/Puuid'

import { DayJsFromNumber } from '../../utils/ioTsUtils'

type RiotSummoner = D.TypeOf<typeof decoder>

const decoder = D.struct({
  puuid: Puuid.codec,
  profileIconId: D.number,
  revisionDate: DayJsFromNumber.decoder,
  summonerLevel: D.number,
})

const RiotSummoner = { decoder }

export { RiotSummoner }
