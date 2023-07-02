import { useMemo, useRef } from 'react'

import type { ChampionLevelOrZero } from '../../../shared/models/api/champion/ChampionLevel'
import { SummonerLeaguesView } from '../../../shared/models/api/summoner/SummonerLeaguesView'
import type { SummonerView } from '../../../shared/models/api/summoner/SummonerView'
import { NumberUtils } from '../../../shared/utils/NumberUtils'
import type { Dict } from '../../../shared/utils/fp'

import { League } from '../../components/League'
import { MasteryImg } from '../../components/MasteryImg'
import { Tooltip } from '../../components/tooltip/Tooltip'
import { useStaticData } from '../../contexts/StaticDataContext'
import type { Translation } from '../../contexts/TranslationContext'
import { useTranslation } from '../../contexts/TranslationContext'
import { InformationCircleOutline } from '../../imgs/svgIcons'
import { cx } from '../../utils/cx'

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
  const { t } = useTranslation()
  const staticData = useStaticData()

  const levelRef = useRef<HTMLSpanElement>(null)
  const masteriesRef = useRef<HTMLDivElement>(null)
  const infoRef = useRef<HTMLSpanElement>(null)

  const MasteryImgWithCount = useMemo(
    () => getMasteryImgWithCount(t.common, masteriesCount),
    [masteriesCount, t.common],
  )

  return (
    <div className="relative flex w-full max-w-7xl flex-wrap items-center justify-between gap-6">
      <div className="flex flex-wrap gap-4">
        <img
          src={staticData.assets.summonerIcon(profileIconId)}
          alt={t.common.summonerIconAlt(name)}
          className="h-24 w-24 rounded border border-goldenrod-bis"
        />
        <div className="grid grid-rows-[1fr_auto] items-center gap-4">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-lg text-goldenrod">{name}</span>
            <span className="text-sm text-grey-400">—</span>
            <span ref={levelRef} className="text-sm">
              {t.summoner.level(summonerLevel)}
            </span>
            <Tooltip hoverRef={levelRef} placement="right">
              {t.summoner.summonerLevel}
            </Tooltip>
          </div>
          <div className="flex flex-wrap gap-6">
            {SummonerLeaguesView.keys.map(queue => (
              <League key={queue} queue={queue} league={leagues[queue]} />
            ))}
          </div>
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
          <span className="text-sm">{t.summoner.masteriesLevel(totalMasteryLevel)}</span>
        </Tooltip>
        <span className="flex items-center gap-2">
          <span className="text-sm">{t.summoner.percentsProgression(round(questPercents, 2))}</span>
          <span ref={infoRef}>
            <InformationCircleOutline className="h-6" />
          </span>
          <Tooltip hoverRef={infoRef}>
            <ul className="list-disc pl-3 leading-6">{t.summoner.masteriesExplanation}</ul>
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
  (
    t: Translation['common'],
    masteriesCount: Dict<`${ChampionLevelOrZero}`, number>,
  ): React.FC<MasteryImgWithCountProps> =>
  ({ level, imgClassName, className }) =>
    (
      <div className={cx('flex flex-col items-center', className)}>
        <span className="text-xs">{t.number(masteriesCount[level])}</span>
        <MasteryImg level={level} className={cx('w-full', imgClassName)} />
      </div>
    )
