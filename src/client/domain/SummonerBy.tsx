/* eslint-disable functional/no-expression-statements */
import { useEffect } from 'react'

import { apiRoutes } from '../../shared/ApiRouter'
import type { Platform } from '../../shared/models/api/Platform'
import { SummonerActiveGameView } from '../../shared/models/api/activeGame/SummonerActiveGameView'
import type { Puuid } from '../../shared/models/api/summoner/Puuid'
import { SummonerMasteriesView } from '../../shared/models/api/summoner/SummonerMasteriesView'
import { Maybe } from '../../shared/utils/fp'

import { AsyncRenderer } from '../components/AsyncRenderer'
import { Navigate } from '../components/Navigate'
import { MainLayout } from '../components/mainLayout/MainLayout'
import { HistoryState, useHistory } from '../contexts/HistoryContext'
import { useTranslation } from '../contexts/TranslationContext'
import { useSWRHttp } from '../hooks/useSWRHttp'
import { MasteriesQuery } from '../models/masteriesQuery/MasteriesQuery'
import { appRoutes } from '../router/AppRouter'

type ByPuuidProps = {
  platform: Platform
  puuid: Puuid
}

export const SummonerByPuuidProfile: React.FC<ByPuuidProps> = ({ platform, puuid }) => (
  <MainLayout>
    <AsyncRenderer
      {...useSWRHttp(apiRoutes.summoner.byPuuid(platform)(puuid).masteries.get, {}, [
        SummonerMasteriesView.codec,
        'SummonerMasteriesView',
      ])}
    >
      {masteries => <SummonerByProfileLoaded platform={platform} masteries={masteries} />}
    </AsyncRenderer>
  </MainLayout>
)

export const SummonerByPuuidGame: React.FC<ByPuuidProps> = ({ platform, puuid }) => {
  const { lang } = useTranslation()

  return (
    <MainLayout>
      <AsyncRenderer
        {...useSWRHttp(apiRoutes.summoner.byPuuid(platform)(puuid).activeGame(lang).get, {}, [
          SummonerActiveGameView.codec,
          'SummonerActiveGameView',
        ])}
      >
        {game => <SummonerByGameLoaded platform={platform} game={game} />}
      </AsyncRenderer>
    </MainLayout>
  )
}

type ProfileLoadedProps = {
  platform: Platform
  masteries: SummonerMasteriesView
}

const SummonerByProfileLoaded: React.FC<ProfileLoadedProps> = ({ platform, masteries }) => {
  const { modifyHistoryStateRef, masteriesQuery } = useHistory()

  useEffect(() => {
    modifyHistoryStateRef(HistoryState.Lens.masteries.set(Maybe.some(masteries)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Navigate
      to={appRoutes.platformRiotId(
        platform,
        masteries.summoner.riotId,
        MasteriesQuery.toPartial(masteriesQuery),
      )}
      replace={true}
    />
  )
}
type GameLoadedProps = {
  platform: Platform
  game: SummonerActiveGameView
}

const SummonerByGameLoaded: React.FC<GameLoadedProps> = ({ platform, game }) => {
  const { modifyHistoryStateRef } = useHistory()

  useEffect(() => {
    modifyHistoryStateRef(HistoryState.Lens.game.set(Maybe.some(game)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Navigate to={appRoutes.platformRiotIdGame(platform, game.summoner.riotId)} replace={true} />
  )
}
