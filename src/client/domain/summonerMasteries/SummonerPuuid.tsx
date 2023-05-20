/* eslint-disable functional/no-expression-statements */
import { useEffect } from 'react'

import { apiRoutes } from '../../../shared/ApiRouter'
import type { Platform } from '../../../shared/models/api/Platform'
import type { Puuid } from '../../../shared/models/api/summoner/Puuid'
import { SummonerMasteriesView } from '../../../shared/models/api/summoner/SummonerMasteriesView'
import { Maybe } from '../../../shared/utils/fp'

import { MainLayout } from '../../components/mainLayout/MainLayout'
import { HistoryState, useHistory } from '../../contexts/HistoryContext'
import { useSWRHttp } from '../../hooks/useSWRHttp'
import { MasteriesQuery } from '../../models/masteriesQuery/MasteriesQuery'
import { appRoutes } from '../../router/AppRouter'
import { basicAsyncRenderer } from '../../utils/basicAsyncRenderer'

type SummonerPuuidProps = {
  platform: Platform
  puuid: Puuid
}

export const SummonerPuuid: React.FC<SummonerPuuidProps> = ({ platform, puuid }) => (
  <MainLayout>
    {basicAsyncRenderer(
      useSWRHttp(apiRoutes.summoner.byPuuid(platform, puuid).masteries.get, {}, [
        SummonerMasteriesView.codec,
        'SummonerMasteriesView',
      ]),
    )(summonerMasteries => (
      <SummonerPuuidLoaded platform={platform} summonerMasteries={summonerMasteries} />
    ))}
  </MainLayout>
)

type SummonerPuuidLoadedProps = {
  platform: Platform
  summonerMasteries: SummonerMasteriesView
}

const SummonerPuuidLoaded: React.FC<SummonerPuuidLoadedProps> = ({
  platform,
  summonerMasteries,
}) => {
  const { summoner } = summonerMasteries

  const { modifyHistoryStateRef, navigate, masteriesQuery } = useHistory()

  useEffect(() => {
    modifyHistoryStateRef(HistoryState.Lens.summonerMasteries.set(Maybe.some(summonerMasteries)))
    navigate(
      appRoutes.platformSummonerName(
        platform,
        summoner.name,
        MasteriesQuery.toPartial(masteriesQuery),
      ),
      { replace: true },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
