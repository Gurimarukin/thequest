import * as D from 'io-ts/Decoder'

import { SummonerId } from '../../../shared/models/SummonerId'

import { DayJsFromNumber } from '../../utils/ioTsUtils'
import { AccountId } from './AccountId'
import { Puuid } from './Puuid'

type Summoner = D.TypeOf<typeof codec>

const codec = D.struct({
  id: SummonerId.codec,
  accountId: AccountId.codec,
  puuid: Puuid.codec,
  name: D.string,
  profileIconId: D.number,
  revisionDate: DayJsFromNumber.decoder,
  summonerLevel: D.number,
})

const Summoner = { codec }

export { Summoner }
