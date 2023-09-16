import type { HttpMethod } from 'ky/distribution/types/options'
import type { SWRResponse } from 'swr'
import useSWR from 'swr'

import { apiRoutes } from '../../../shared/ApiRouter'
import type { Platform } from '../../../shared/models/api/Platform'
import { ChallengesView } from '../../../shared/models/api/challenges/ChallengesView'
import { type Tuple3 } from '../../../shared/utils/fp'

import { config } from '../../config/unsafe'
import { useHistory } from '../../contexts/HistoryContext'
import type { MasteriesQueryView } from '../../models/masteriesQuery/MasteriesQueryView'
import { futureRunUnsafe } from '../../utils/futureRunUnsafe'
import { http } from '../../utils/http'

export const useChallenges = (
  platform: Platform,
  summonerName: string,
): SWRResponse<ChallengesView, unknown> => {
  const { masteriesQuery } = useHistory()

  return useSWR<ChallengesView, unknown, Tuple3<string, HttpMethod, boolean>>(
    [
      ...apiRoutes.summoner.byName(platform, summonerName).challenges.get,
      getShouldFetchChallenges(masteriesQuery.view),
    ],
    ([url, method, shouldFetchChallenges]) =>
      shouldFetchChallenges
        ? futureRunUnsafe(http([url, method], {}, [ChallengesView.codec, 'ChallengesView']))
        : Promise.reject(Error('Challenges should not be used for this view')),
    {
      revalidateIfStale: !config.isDev,
      revalidateOnFocus: !config.isDev,
      revalidateOnReconnect: !config.isDev,
    },
  )
}

const getShouldFetchChallenges = (view: MasteriesQueryView): boolean => view === 'factions'
