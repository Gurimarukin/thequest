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
  // readonly totalChampionsCount: number
  readonly totalMasteryLevel: number
  readonly masteriesCount: Dict<`${ChampionLevelOrZero}`, number>
}

export const Summoner = ({
  summoner: {
    name,
    profileIconId,
    summonerLevel,
    questPercents,
    // totalChampionsCount,
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
            alt={`Icône de ${name}`}
            className="h-24 w-24"
          />
          <div className="flex flex-col">
            <span className="text-lg text-goldenrod">{name}</span>
            <span className="text-sm">Niveau {summonerLevel}</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="peer/masteries flex items-end gap-2">
            <MasteryImgWithCount level={7} imgClassName="h-16 mt-[-6px]" />
            <MasteryImgWithCount level={6} imgClassName="h-16 mt-[-7px] mb-[-4px]" />
            <MasteryImgWithCount level={5} imgClassName="h-16 mt-[-11px] mb-[-6px]" />
          </div>
          <span className="flex items-center gap-2">
            <span className="text-sm">Progression : {round(questPercents, 2)}%</span>
            <InformationCircleOutline className="peer/info h-6 fill-current" />
            <ul className="invisible absolute right-0 top-[calc(100%_+_.75rem)] z-10 list-disc border-2 border-mastery4-brown-secondary bg-black py-4 pr-4 pl-7 text-sm peer-hover/info:visible">
              <li>
                De la maîtrise 0 à la maîtrise 5, les pourcents correspondent aux points de
                maîtrise.
              </li>
              <li>Maîtrise 5 = 50 %</li>
              <li>Chaque fragment = 3 %</li>
              <li>
                Chaque jeton pour la maîtrise 6 = 7 % (maîtrise 5, 1 jeton = 57 % ; maîtrise 5, 2
                jetons = 64 %)
              </li>
              <li>Maîtrise 6 = 67 %</li>
              <li>
                Chaque jeton pour la maîtrise 7 = 10 % (maîtrise 6, 1 jeton = 77 % ; maîtrise 6, 2
                jetons = 87 % ; maîtrise 6, 3 jetons = 97 %)
              </li>
              <li>Maîtrise 7 = 100 %</li>
            </ul>
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
            {/* <span className="text-xs">(Nombre total de champions : {totalChampionsCount})</span> */}
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
