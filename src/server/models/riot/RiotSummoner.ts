import * as D from 'io-ts/Decoder'

import { Puuid } from '../../../shared/models/api/summoner/Puuid'

import { DayJsFromNumber } from '../../utils/ioTsUtils'
import { SummonerId } from '../summoner/SummonerId'
import { AccountId } from './AccountId'

type RiotSummoner = D.TypeOf<typeof decoder>

const decoder = D.struct({
  id: SummonerId.codec,
  accountId: AccountId.codec,
  puuid: Puuid.codec,
  profileIconId: D.number,
  revisionDate: DayJsFromNumber.decoder,
  summonerLevel: D.number,
})

const RiotSummoner = { decoder }

export { RiotSummoner }
