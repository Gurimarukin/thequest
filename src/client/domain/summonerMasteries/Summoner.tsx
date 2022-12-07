import { pipe } from 'fp-ts/function'
import React, { Fragment } from 'react'

import { ChampionLevelOrZero } from '../../../shared/models/api/ChampionLevel'
import type { SummonerView } from '../../../shared/models/api/summoner/SummonerView'
import type { Dict } from '../../../shared/utils/fp'
import { List } from '../../../shared/utils/fp'

import { useStaticData } from '../../contexts/StaticDataContext'
import { NumberUtils } from '../../utils/NumberUtils'

const { round } = NumberUtils

type Props = {
  readonly summoner: EnrichedSummonerView
}

export type EnrichedSummonerView = SummonerView & {
  readonly questPercents: number
  readonly totalChampionsCount: number
  readonly totalMasteryLevel: number
  readonly masteriesCount: Dict<`${ChampionLevelOrZero}`, number>
}

export const Summoner = ({
  summoner: {
    name,
    profileIconId,
    summonerLevel,
    questPercents,
    totalChampionsCount,
    totalMasteryLevel,
    masteriesCount,
  },
}: Props): JSX.Element => {
  const staticData = useStaticData()

  return (
    <div className="flex-wrap flex items-center gap-6 border-b border-goldenrod">
      <img
        src={staticData.assets.summonerIcon(profileIconId)}
        alt={`${name}’s icon`}
        className="h-24 w-24"
      />
      <span>{name}</span>
      <span>Niveau d'invocateur : {summonerLevel}</span>
      <span>Niveau de maîtrise : {totalMasteryLevel}</span>
      <span>Progression Quêêête : {round(questPercents, 2)}%</span>
      <span>(Nombre total de champions : {totalChampionsCount})</span>
      <span>
        {pipe(
          ChampionLevelOrZero.values,
          List.reverse,
          List.mapWithIndex((i, key) => (
            <Fragment key={key}>
              {key} : {masteriesCount[key]}
              {i !== ChampionLevelOrZero.values.length - 1 ? ', ' : null}
            </Fragment>
          )),
        )}
      </span>
    </div>
  )
}
