import { Route, parse } from 'fp-ts-routing'
import { useMemo } from 'react'

import { Maybe } from '../../shared/utils/fp'

import { useHistory } from '../contexts/HistoryContext'
import { appParsers } from '../router/AppRouter'

export const useSummonerNameFromLocation = (): Maybe<string> => {
  const { location } = useHistory()

  return useMemo(
    () =>
      parse(
        appParsers.platformSummonerName.map(f => Maybe.some(f.summonerName)),
        Route.parse(location.pathname),
        Maybe.none,
      ),
    [location.pathname],
  )
}
