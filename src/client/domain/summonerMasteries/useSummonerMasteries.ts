import { flow, pipe } from 'fp-ts/function'
import type { SWRResponse } from 'swr'
import useSWR from 'swr'

import { apiRoutes } from '../../../shared/ApiRouter'
import type { Platform } from '../../../shared/models/api/Platform'
import { SummonerMasteriesView } from '../../../shared/models/api/summoner/SummonerMasteriesView'
import type { RiotId } from '../../../shared/models/riot/RiotId'
import { Future, Maybe } from '../../../shared/utils/fp'

import { config } from '../../config/unsafe'
import { HistoryState, useHistory } from '../../contexts/HistoryContext'
import { futureRunUnsafe } from '../../utils/futureRunUnsafe'
import { http } from '../../utils/http'

export const useSummonerMasteries = (
  platform: Platform,
  riotId: RiotId,
): SWRResponse<SummonerMasteriesView, unknown> => {
  const { historyStateRef, modifyHistoryStateRef } = useHistory()

  return useSWR(
    apiRoutes.summoner.byRiotId(platform)(riotId).masteries.get,
    ([url, method]) =>
      pipe(
        historyStateRef.current.masteries,
        Maybe.fold(
          () => http([url, method], {}, [SummonerMasteriesView.codec, 'SummonerMasteriesView']),
          flow(
            Future.successful,
            Future.chainFirstIOK(
              () => () => modifyHistoryStateRef(HistoryState.Lens.masteries.set(Maybe.none)),
            ),
          ),
        ),
        futureRunUnsafe,
      ),
    {
      revalidateIfStale: !config.isDev,
      revalidateOnFocus: !config.isDev,
      revalidateOnReconnect: !config.isDev,
    },
  )
}
