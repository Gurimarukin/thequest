import React, { useMemo } from 'react'

import type { ChampionLevelOrZero } from '../../../shared/models/api/ChampionLevel'
import type { SummonerView } from '../../../shared/models/api/summoner/SummonerView'
import type { Dict } from '../../../shared/utils/fp'

import { MasteryImg } from '../../components/MasteryImg'
import { useStaticData } from '../../contexts/StaticDataContext'
import { InformationCircleOutline } from '../../imgs/svgIcons'
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

  const MasteryImgWithCount = useMemo(
    () => getMasteryImgWithCount(masteriesCount),
    [masteriesCount],
  )

  return (
    <div className="flex justify-center">
      <div className="relative flex w-full max-w-7xl flex-wrap items-center justify-between gap-6 px-3 pt-1">
        <div className="flex items-center gap-4">
          <img
            src={staticData.assets.summonerIcon(profileIconId)}
            alt={`${name}’s icon`}
            className="h-24 w-24"
          />
          <div className="flex flex-col">
            <span className="text-lg text-goldenrod">{name}</span>
            <span className="text-sm">Niveau {summonerLevel}</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          {/* eslint-disable-next-line tailwindcss/no-custom-classname */}
          <div className="peer/masteries flex items-end gap-2">
            <MasteryImgWithCount level={7} imgClassName="h-16 mt-[-6px]" />
            <MasteryImgWithCount level={6} imgClassName="h-16 mt-[-7px] mb-[-4px]" />
            <MasteryImgWithCount level={5} imgClassName="h-16 mt-[-11px] mb-[-6px]" />
          </div>
          <span className="flex items-center gap-2 text-lg">
            <span>Progression : {round(questPercents, 2)}%</span>
            {/* eslint-disable-next-line tailwindcss/no-custom-classname */}
            <InformationCircleOutline className="peer/info h-6 fill-current" />
          </span>
          <div className="invisible absolute right-0 top-[calc(100%_+_.75rem)] z-10 flex flex-col items-center gap-2 border-2 border-mastery4-brown-secondary bg-black px-5 pt-3 pb-4 peer-hover/masteries:visible">
            <div className="flex items-end gap-1">
              <MasteryImgWithCount level={4} imgClassName="h-12 mt-[-6px]" />
              <MasteryImgWithCount level={3} imgClassName="h-12 mt-[-9px] mb-[-3px]" />
              <MasteryImgWithCount level={2} imgClassName="h-12 mt-[-10px] mb-[-5px]" />
              <MasteryImgWithCount level={1} imgClassName="h-12 mt-[-10px] mb-[-8px]" />
              <MasteryImgWithCount level={0} imgClassName="h-12 mt-[-10px] mb-[-8px]" />
            </div>
            <span className="text-sm">Niveau de maîtrise : {totalMasteryLevel}</span>
            <span className="text-xs">(Nombre total de champions : {totalChampionsCount})</span>
          </div>
        </div>
      </div>
    </div>
  )
}

type MasteryImgWithCountProps = {
  readonly level: ChampionLevelOrZero
  readonly imgClassName?: string
}

const getMasteryImgWithCount =
  (masteriesCount: Dict<`${ChampionLevelOrZero}`, number>) =>
  ({ level, imgClassName }: MasteryImgWithCountProps): JSX.Element =>
    (
      <div className="flex flex-col items-center">
        <span className="text-xs">{masteriesCount[level]}</span>
        <MasteryImg level={level} className={imgClassName} />
      </div>
    )
