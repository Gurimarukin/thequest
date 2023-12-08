import { flow, pipe } from 'fp-ts/function'
import { useCallback } from 'react'
import type { SWRResponse } from 'swr'
import useSWR, { useSWRConfig } from 'swr'

import { apiRoutes } from '../../../shared/ApiRouter'
import type { Lang } from '../../../shared/models/api/Lang'
import type { Platform } from '../../../shared/models/api/Platform'
import { SummonerActiveGameView } from '../../../shared/models/api/activeGame/SummonerActiveGameView'
import type { RiotId } from '../../../shared/models/riot/RiotId'
import { Future, Maybe } from '../../../shared/utils/fp'

import { config } from '../../config/unsafe'
import { HistoryState, useHistory } from '../../contexts/HistoryContext'
import { futureRunUnsafe } from '../../utils/futureRunUnsafe'
import { http } from '../../utils/http'

export function useActiveGame(
  lang: Lang,
  platform: Platform,
  riotId: RiotId,
): SWRResponse<SummonerActiveGameView, unknown> {
  const { mutate } = useSWRConfig()

  const { historyStateRef, modifyHistoryStateRef } = useHistory()

  const key = apiRoutes.summoner.byRiotId(platform)(riotId).activeGame(lang).get

  const res = useSWR(
    key,
    ([url, method]) =>
      pipe(
        historyStateRef.current.game,
        Maybe.fold(
          () => http([url, method], {}, [SummonerActiveGameView.codec, 'SummonerActiveGameView']),
          flow(
            Future.successful,
            Future.chainFirstIOK(
              () => () => modifyHistoryStateRef(HistoryState.Lens.game.set(Maybe.none)),
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

  return {
    ...res,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    mutate: useCallback<typeof res.mutate>((...args) => mutate(key, ...args), [...key, mutate]),
  }
}
