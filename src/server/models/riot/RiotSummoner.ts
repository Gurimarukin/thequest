import * as D from 'io-ts/Decoder'

import { SummonerId } from '../../../shared/models/api/SummonerId'

import { DayJsFromNumber } from '../../utils/ioTsUtils'
import { AccountId } from './AccountId'
import { Puuid } from './Puuid'

type RiotSummoner = D.TypeOf<typeof decoder>

const decoder = D.struct({
  id: SummonerId.codec,
  accountId: AccountId.codec,
  puuid: Puuid.codec,
  name: D.string,
  profileIconId: D.number,
  revisionDate: DayJsFromNumber.decoder,
  summonerLevel: D.number,
})

const RiotSummoner = { decoder }

export { RiotSummoner }
