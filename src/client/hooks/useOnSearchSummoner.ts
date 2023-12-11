/* eslint-disable functional/no-expression-statements */
import { useEffect } from 'react'

import type { SummonerShort } from '../../shared/models/api/summoner/SummonerShort'
import { RiotId } from '../../shared/models/riot/RiotId'

import { useHistory } from '../contexts/HistoryContext'
import { useUser } from '../contexts/UserContext'
import { appParsers } from '../router/AppRouter'
import { usePathMatch } from './usePathMatch'

// eslint-disable-next-line functional/no-return-void
export function useOnSearchSummoner(summoner: SummonerShort, correctUrlCase: string): void {
  const { navigate } = useHistory()
  const { addRecentSearch } = useUser()

  useEffect(() => addRecentSearch(summoner), [addRecentSearch, summoner])

  const riotIdFromLocation = usePathMatch(appParsers.anyPlatformRiotId)?.riotId

  // Correct Riot ID's case in url
  useEffect(() => {
    if (
      riotIdFromLocation !== undefined &&
      !RiotId.Eq.equals(riotIdFromLocation, summoner.riotId)
    ) {
      navigate(correctUrlCase, { replace: true })
    }
  }, [navigate, riotIdFromLocation, summoner.riotId, correctUrlCase])
}
