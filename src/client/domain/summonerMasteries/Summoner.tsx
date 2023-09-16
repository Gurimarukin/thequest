import { pipe } from 'fp-ts/function'
import { useCallback, useMemo, useRef } from 'react'

import { DayJs } from '../../../shared/models/DayJs'
import { MsDuration } from '../../../shared/models/MsDuration'
import type { ChampionLevelOrZero } from '../../../shared/models/api/champion/ChampionLevel'
import { SummonerLeaguesView } from '../../../shared/models/api/summoner/SummonerLeaguesView'
import type { SummonerView } from '../../../shared/models/api/summoner/SummonerView'
import { NumberUtils } from '../../../shared/utils/NumberUtils'
import type { Dict } from '../../../shared/utils/fp'

import { League } from '../../components/League'
import { MasteryImg } from '../../components/MasteryImg'
import { Tooltip } from '../../components/tooltip/Tooltip'
import { useStaticData } from '../../contexts/StaticDataContext'
import { useTranslation } from '../../contexts/TranslationContext'
import { InformationCircleOutline } from '../../imgs/svgs/icons'
import type { Translation } from '../../models/Translation'
import { cx } from '../../utils/cx'

const { round } = NumberUtils

type Props = {
  summoner: EnrichedSummonerView
  leagues: SummonerLeaguesView
  masteries: {
    insertedAt: DayJs
    cacheDuration: MsDuration
  }
}

export type EnrichedSummonerView = SummonerView & {
  questPercents: number
  totalMasteryLevel: number
  totalMasteryPoints: number
  masteriesCount: Dict<`${ChampionLevelOrZero}`, number>
}

export const Summoner: React.FC<Props> = ({
  summoner: {
    name,
    profileIconId,
    summonerLevel,
    questPercents,
    totalMasteryLevel,
    totalMasteryPoints,
    masteriesCount,
  },
  leagues,
  masteries,
}) => {
  const { t } = useTranslation()
  const staticData = useStaticData()

  const nameRef = useRef<HTMLSpanElement>(null)
  const levelRef = useRef<HTMLSpanElement>(null)
  const masteriesRef = useRef<HTMLDivElement>(null)
  const infoRef = useRef<HTMLSpanElement>(null)

  const numberUnit = useCallback(
    (pts: number) => {
      if (1000000 <= pts) return t.common.numberM(round(pts / 1000000, 1))
      if (1000 <= pts) return t.common.numberK(round(pts / 1000, 1))
      return t.common.number(pts)
    },
    [t],
  )

  const MasteryImgWithCount = useMemo(
    () => getMasteryImgWithCount(t.common, masteriesCount),
    [masteriesCount, t],
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
            <span ref={nameRef} className="text-lg text-goldenrod">
              {name}
            </span>
            <Tooltip hoverRef={nameRef} className="flex flex-col items-center">
              <span>
                {t.summoner.masteriesCache.lastUpdate(DayJs.unwrap(masteries.insertedAt).toDate())}
              </span>
              <span>{t.summoner.masteriesCache.duration(prettyMs(masteries.cacheDuration))}</span>
            </Tooltip>
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
          <div className="grid grid-cols-[auto_auto] gap-2 text-sm">
            <span className="justify-self-end">{t.summoner.masteryScore}</span>
            <span>{t.common.number(totalMasteryLevel)}</span>

            <span className="justify-self-end">{t.summoner.pointsScore}</span>
            <span>{numberUnit(totalMasteryPoints)}</span>
          </div>
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

const prettyMs = (ms: MsDuration): number => {
  const date = DayJs.of(MsDuration.unwrap(ms))
  const zero = DayJs.of(0)

  const m = pipe(date, DayJs.diff(zero, 'minutes'))
  const s = DayJs.second.get(date) / 60

  return m + s
}
