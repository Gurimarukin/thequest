/* eslint-disable functional/no-expression-statements */
import { useEffect } from 'react'

import { apiRoutes } from '../../../shared/ApiRouter'
import type { Platform } from '../../../shared/models/api/Platform'
import type { Puuid } from '../../../shared/models/api/summoner/Puuid'
import { SummonerMasteriesView } from '../../../shared/models/api/summoner/SummonerMasteriesView'
import type { Dict } from '../../../shared/utils/fp'
import { Maybe } from '../../../shared/utils/fp'

import { MainLayout } from '../../components/mainLayout/MainLayout'
import { HistoryState, useHistory } from '../../contexts/HistoryContext'
import { useSWRHttp } from '../../hooks/useSWRHttp'
import { MasteriesQuery } from '../../models/masteriesQuery/MasteriesQuery'
import type { PartialMasteriesQuery } from '../../models/masteriesQuery/PartialMasteriesQuery'
import { appRoutes } from '../../router/AppRouter'
import { basicAsyncRenderer } from '../../utils/basicAsyncRenderer'

type SummonerPuuidProps = {
  platform: Platform
  puuid: Puuid
  page: Page
}

type Page = 'profile' | 'game'

export const SummonerPuuid: React.FC<SummonerPuuidProps> = ({ platform, puuid, page }) => (
  <MainLayout>
    {basicAsyncRenderer(
      useSWRHttp(apiRoutes.summoner.byPuuid(platform, puuid).masteries.get, {}, [
        SummonerMasteriesView.codec,
        'SummonerMasteriesView',
      ]),
    )(summonerMasteries => (
      <SummonerPuuidLoaded platform={platform} summonerMasteries={summonerMasteries} page={page} />
    ))}
  </MainLayout>
)

type SummonerPuuidLoadedProps = {
  platform: Platform
  summonerMasteries: SummonerMasteriesView
  page: Page
}

const SummonerPuuidLoaded: React.FC<SummonerPuuidLoadedProps> = ({
  platform,
  summonerMasteries,
  page,
}) => {
  const { summoner } = summonerMasteries

  const { modifyHistoryStateRef, navigate, masteriesQuery } = useHistory()

  useEffect(() => {
    modifyHistoryStateRef(HistoryState.Lens.summonerMasteries.set(Maybe.some(summonerMasteries)))
    navigate(redirectUrl[page](platform, summoner.name, MasteriesQuery.toPartial(masteriesQuery)), {
      replace: true,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

const redirectUrl: Dict<
  Page,
  (platform: Platform, summonerName: string, query: PartialMasteriesQuery) => string
> = {
  profile: appRoutes.platformSummonerName,
  game: appRoutes.platformSummonerNameGame,
}
