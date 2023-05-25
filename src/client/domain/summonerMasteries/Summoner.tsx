import { pipe } from 'fp-ts/function'
import { useMemo, useRef } from 'react'

import type { ChampionLevelOrZero } from '../../../shared/models/api/champion/ChampionLevel'
import { SummonerLeaguesView } from '../../../shared/models/api/summoner/SummonerLeaguesView'
import type { SummonerView } from '../../../shared/models/api/summoner/SummonerView'
import type { Dict } from '../../../shared/utils/fp'
import { List } from '../../../shared/utils/fp'

import { League } from '../../components/League'
import { MasteryImg } from '../../components/MasteryImg'
import { Tooltip } from '../../components/tooltip/Tooltip'
import { useStaticData } from '../../contexts/StaticDataContext'
import { InformationCircleOutline } from '../../imgs/svgIcons'
import { NumberUtils } from '../../utils/NumberUtils'
import { cssClasses } from '../../utils/cssClasses'

const { round } = NumberUtils

type Props = {
  summoner: EnrichedSummonerView
  leagues: SummonerLeaguesView
}

export type EnrichedSummonerView = SummonerView & {
  questPercents: number
  totalMasteryLevel: number
  masteriesCount: Dict<`${ChampionLevelOrZero}`, number>
}

export const Summoner: React.FC<Props> = ({
  summoner: {
    name,
    profileIconId,
    summonerLevel,
    questPercents,
    totalMasteryLevel,
    masteriesCount,
  },
  leagues,
}) => {
  const staticData = useStaticData()

  const levelRef = useRef<HTMLSpanElement>(null)
  const masteriesRef = useRef<HTMLDivElement>(null)
  const infoRef = useRef<HTMLSpanElement>(null)

  const MasteryImgWithCount = useMemo(
    () => getMasteryImgWithCount(masteriesCount),
    [masteriesCount],
  )

  return (
    <div className="relative flex w-full max-w-7xl flex-wrap items-center justify-between gap-6">
      <div className="flex flex-wrap gap-4">
        <img
          src={staticData.assets.summonerIcon(profileIconId)}
          alt={`Icône de ${name}`}
          className="h-24 w-24 rounded border border-goldenrod-bis"
        />
        <div className="grid grid-rows-[1fr_auto] items-center gap-4">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-lg text-goldenrod">{name}</span>
            <span className="text-sm text-grey-400">—</span>
            <span ref={levelRef} className="text-sm">
              {summonerLevel}
            </span>
            <Tooltip hoverRef={levelRef} placement="right">
              Niveau d’invocateur
            </Tooltip>
          </div>
          <ul className="flex flex-wrap gap-6">
            {pipe(
              SummonerLeaguesView.keys,
              List.map(queue => <League key={queue} queue={queue} league={leagues[queue]} />),
            )}
          </ul>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div ref={masteriesRef} className="flex items-end gap-2">
          <MasteryImgWithCount level={7} imgClassName="!w-[72px] -mt-1.5" />
          <MasteryImgWithCount level={6} imgClassName="!w-[72px] mt-[-7px] -mb-1" />
          <MasteryImgWithCount level={5} imgClassName="!w-[72px] mt-[-11px] -mb-1.5" />
        </div>
        <Tooltip
          hoverRef={masteriesRef}
          className="grid grid-cols-[1fr] justify-items-center gap-2 px-5 pb-4 pt-3"
        >
          <div className="grid grid-cols-[repeat(4,54px)_34px] items-end gap-1">
            <MasteryImgWithCount level={4} imgClassName="-mt-1.5" />
            <MasteryImgWithCount level={3} imgClassName="mt-[-9px] mb-[-3px]" />
            <MasteryImgWithCount level={2} imgClassName="-mt-2.5 mb-[-5px]" />
            <MasteryImgWithCount level={1} imgClassName="-mt-2.5 -mb-2" />
            <MasteryImgWithCount
              level={0}
              imgClassName="-mt-2.5 -mb-2"
              className="relative -left-2.5 w-[54px]"
            />
          </div>
          <span className="text-sm">Niveau de maîtrise : {totalMasteryLevel}</span>
        </Tooltip>
        <span className="flex items-center gap-2">
          <span className="text-sm">Progression : {round(questPercents, 2)} %</span>
          <span ref={infoRef}>
            <InformationCircleOutline className="h-6" />
          </span>
          <Tooltip hoverRef={infoRef}>
            <ul className="list-disc pl-3 leading-6">
              <li>
                De la maîtrise 0 à la maîtrise 5, les pourcents correspondent aux points de
                maîtrise.
              </li>
              <li>Maîtrise 5 = 50 %</li>
              <li>Chaque fragment = 3 %</li>
              <li>
                Chaque jeton pour la maîtrise 6 = 7 % (maîtrise 5 + 1 jeton = 57 % ; maîtrise 5 + 2
                jetons = 64 %)
              </li>
              <li>Maîtrise 6 = 67 %</li>
              <li>
                Chaque jeton pour la maîtrise 7 = 10 % (maîtrise 6 + 1 jeton = 77 % ; maîtrise 6 + 2
                jetons = 87 % ; maîtrise 6 + 3 jetons = 97 %)
              </li>
              <li>Maîtrise 7 = 100 %</li>
            </ul>
          </Tooltip>
        </span>
      </div>
    </div>
  )
}

type MasteryImgWithCountProps = {
  level: ChampionLevelOrZero
  imgClassName?: string
  className?: string
}

const getMasteryImgWithCount =
  (masteriesCount: Dict<`${ChampionLevelOrZero}`, number>): React.FC<MasteryImgWithCountProps> =>
  ({ level, imgClassName, className }) =>
    (
      <div className={cssClasses('flex flex-col items-center', className)}>
        <span className="text-xs">{masteriesCount[level]}</span>
        <MasteryImg level={level} className={cssClasses('w-full', imgClassName)} />
      </div>
    )
