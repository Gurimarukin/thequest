import { Route, parse } from 'fp-ts-routing'
import { useMemo } from 'react'

import type { PlatformWithRiotId } from '../../shared/models/api/summoner/PlatformWithRiotId'

import { useHistory } from '../contexts/HistoryContext'
import { appParsers } from '../router/AppRouter'

export function usePlatformWithRiotIdFromLocation(): PlatformWithRiotId | undefined {
  const { location } = useHistory()

  return useMemo(
    () => parse(appParsers.anyPlatformRiotId, Route.parse(location.pathname), undefined),
    [location.pathname],
  )
}
