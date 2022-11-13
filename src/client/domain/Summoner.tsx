import React from 'react'

import { apiRoutes } from '../../shared/ApiRouter'
import type { Platform } from '../../shared/models/api/Platform'
import { SummonerView } from '../../shared/models/api/SummonerView'

import { useDDragon } from '../contexts/DDragonContext'
import { useSWRHttp } from '../hooks/useSWRHttp'
import { basicAsyncRenderer } from '../utils/basicAsyncRenderer'

type Props = {
  readonly platform: Platform
  readonly summonerName: string
}

export const Summoner = ({ platform, summonerName }: Props): JSX.Element =>
  basicAsyncRenderer(
    useSWRHttp(apiRoutes.platform.summoner.byName.get(platform, summonerName), {}, [
      SummonerView.codec,
      'SummonerView',
    ]),
  )(summoner => <SummonerViewComponent summoner={summoner} />)

type SummonerViewProps = {
  readonly summoner: SummonerView
}

const SummonerViewComponent = ({
  summoner: { summoner, masteries },
}: SummonerViewProps): JSX.Element => {
  const ddragon = useDDragon()

  return (
    <>
      <div>
        <img src={ddragon.assets.summonerIcon(summoner.profileIconId)} alt="" />
        <span>{summoner.name}</span>
        <span>{summoner.summonerLevel}</span>
      </div>
      <pre className="w-full p-6">{JSON.stringify(masteries, null, 2)}</pre>
    </>
  )
}
