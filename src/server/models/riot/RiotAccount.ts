import type { Puuid } from '../../../shared/models/api/summoner/Puuid'
import { RiotId } from '../../../shared/models/riot/RiotId'

import type { RiotRiotAccount } from './RiotRiotAccounts'

type RiotAccount = {
  puuid: Puuid
  riotId: RiotId
}

function fromApi(account: RiotRiotAccount): RiotAccount {
  return {
    puuid: account.puuid,
    riotId: RiotId(account.gameName, account.tagLine),
  }
}

const RiotAccount = { fromApi }

export { RiotAccount }
