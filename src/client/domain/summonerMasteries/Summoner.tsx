import React from 'react'

import type { SummonerView } from '../../../shared/models/api/summoner/SummonerView'

import { useStaticData } from '../../contexts/StaticDataContext'

type Props = {
  readonly summoner: SummonerView
}

export const Summoner = ({ summoner }: Props): JSX.Element => {
  const staticData = useStaticData()

  return (
    <div className="flex items-center gap-6">
      <img
        src={staticData.assets.summonerIcon(summoner.profileIconId)}
        alt={`${summoner.name}’s icon`}
        className="h-24 w-24"
      />
      <span>{summoner.name}</span>
      <span>{summoner.summonerLevel}</span>
    </div>
  )
}
