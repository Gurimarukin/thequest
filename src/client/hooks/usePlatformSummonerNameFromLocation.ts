import { Route, parse } from 'fp-ts-routing'
import { useMemo } from 'react'

import type { Platform } from '../../shared/models/api/Platform'

import { useHistory } from '../contexts/HistoryContext'
import { appParsers } from '../router/AppRouter'

type PlatformSummonerName = {
  platform: Platform
  summonerName: string
}

export const usePlatformSummonerNameFromLocation = (): PlatformSummonerName | undefined => {
  const { location } = useHistory()

  return useMemo(
    () => parse(appParsers.anyPlatformSummonerName, Route.parse(location.pathname), undefined),
    [location.pathname],
  )
}
