import React, { useEffect } from 'react'

import { apiRoutes } from '../../../shared/ApiRouter'
import type { ChampionMasteryView } from '../../../shared/models/api/ChampionMasteryView'
import type { Platform } from '../../../shared/models/api/Platform'
import { SummonerMasteriesView } from '../../../shared/models/api/summoner/SummonerMasteriesView'
import type { SummonerView } from '../../../shared/models/api/summoner/SummonerView'
import type { List } from '../../../shared/utils/fp'

import { MainLayout } from '../../components/MainLayout'
import { useHistory } from '../../contexts/HistoryContext'
import { useUser } from '../../contexts/UserContext'
import { useSWRHttp } from '../../hooks/useSWRHttp'
import { useSummonerNameFromLocation } from '../../hooks/useSummonerNameFromLocation'
import { appRoutes } from '../../router/AppRouter'
import { basicAsyncRenderer } from '../../utils/basicAsyncRenderer'
import { Masteries } from './Masteries'
import { Summoner } from './Summoner'

type Props = {
  readonly platform: Platform
  readonly summonerName: string
}

export const SummonerMasteries = ({ platform, summonerName }: Props): JSX.Element => (
  <MainLayout>
    {basicAsyncRenderer(
      useSWRHttp(
        apiRoutes.platform.summoner.byName.get(platform, clearSummonerName(summonerName)),
        {},
        [SummonerMasteriesView.codec, 'SummonerView'],
      ),
    )(({ summoner, masteries }) => (
      <SummonerViewComponent platform={platform} summoner={summoner} masteries={masteries} />
    ))}
  </MainLayout>
)

const whiteSpaces = /\s+/g
const clearSummonerName = (name: string): string => name.toLowerCase().replaceAll(whiteSpaces, '')

type SummonerViewProps = {
  readonly platform: Platform
  readonly summoner: SummonerView
  readonly masteries: List<ChampionMasteryView>
}

const SummonerViewComponent = ({
  platform,
  summoner,
  masteries,
}: SummonerViewProps): JSX.Element => {
  const { navigate } = useHistory()
  const { addRecentSearch } = useUser()

  useEffect(
    () =>
      addRecentSearch({
        platform,
        name: summoner.name,
        profileIconId: summoner.profileIconId,
      }),
    [addRecentSearch, platform, summoner.name, summoner.profileIconId],
  )

  const summonerNameFromLocation = useSummonerNameFromLocation()
  useEffect(
    () => navigate(appRoutes.platformSummonerName(platform, summoner.name), { replace: true }),
    [summonerNameFromLocation, navigate, platform, summoner.name],
  )

  return (
    <div className="p-2 flex flex-col">
      <Summoner summoner={summoner} />
      <Masteries masteries={masteries} />
    </div>
  )
}
