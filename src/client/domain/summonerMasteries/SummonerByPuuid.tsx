/* eslint-disable functional/no-expression-statements */
import React, { useEffect } from 'react'
import type { SWRResponse } from 'swr'

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

type Props = {
  platform: Platform
  puuid: Puuid
}

export const SummonerByPuuid = ({ platform, puuid }: Props): JSX.Element => {
  const { data, error, mutate } = useSWRHttp(apiRoutes.summoner.byPuuid.get(platform, puuid), {}, [
    SummonerMasteriesView.codec,
    'SummonerMasteriesView',
  ])

  return (
    <MainLayout>
      {basicAsyncRenderer({ data, error })(summonerMasteries => (
        <SummonerByPuuidComponent
          platform={platform}
          summonerMasteries={summonerMasteries}
          mutate={mutate}
        />
      ))}
    </MainLayout>
  )
}

type SummonerByPuuidComponentProps = Pick<SWRResponse<SummonerMasteriesView, unknown>, 'mutate'> & {
  platform: Platform
  summonerMasteries: SummonerMasteriesView
}

const SummonerByPuuidComponent = ({
  platform,
  summonerMasteries,
}: SummonerByPuuidComponentProps): null => {
  const { modifyHistoryStateRef, navigate, masteriesQuery } = useHistory()

  // Replace puuid with summoner's name in url
  useEffect(() => {
    modifyHistoryStateRef(HistoryState.Lens.summonerMasteries.set(Maybe.some(summonerMasteries)))
    navigate(
      appRoutes.platformSummonerName(
        platform,
        summonerMasteries.summoner.name,
        MasteriesQuery.toPartial(masteriesQuery),
      ),
      { replace: true },
    )
  }, [masteriesQuery, navigate, platform, modifyHistoryStateRef, summonerMasteries])

  return null
}
