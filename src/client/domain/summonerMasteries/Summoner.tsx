import { pipe } from 'fp-ts/function'
import { useMemo, useRef } from 'react'

import { DayJs } from '../../../shared/models/DayJs'
import { MsDuration } from '../../../shared/models/MsDuration'
import { ChampionLevel } from '../../../shared/models/api/champion/ChampionLevel'
import { SummonerLeaguesView } from '../../../shared/models/api/summoner/SummonerLeaguesView'
import type { SummonerView } from '../../../shared/models/api/summoner/SummonerView'
import { GameName } from '../../../shared/models/riot/GameName'
import { RiotId } from '../../../shared/models/riot/RiotId'
import { SummonerName } from '../../../shared/models/riot/SummonerName'
import { TagLine } from '../../../shared/models/riot/TagLine'
import { NumberUtils } from '../../../shared/utils/NumberUtils'
import { type Dict, Maybe } from '../../../shared/utils/fp'

import { League } from '../../components/League'
import { MasteryImg } from '../../components/MasteryImg'
import { Tooltip } from '../../components/tooltip/Tooltip'
import { useStaticData } from '../../contexts/StaticDataContext'
import { useTranslation } from '../../contexts/TranslationContext'
import { InformationCircleOutline } from '../../imgs/svgs/icons'
import type { Translation } from '../../models/Translation'
import { TranslationUtils } from '../../utils/TranslationUtils'
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
  otpIndex: number
  masteriesCount: Dict<`${number}`, number>
}

export const Summoner: React.FC<Props> = ({
  summoner: {
    riotId,
    name: maybeName,
    profileIconId,
    summonerLevel,
    questPercents,
    totalMasteryLevel,
    totalMasteryPoints,
    otpIndex,
    masteriesCount,
  },
  leagues,
  masteries,
}) => {
  const { t } = useTranslation()
  const staticData = useStaticData()

  const nameRef = useRef<HTMLDivElement>(null)
  const levelRef = useRef<HTMLSpanElement>(null)
  const masteriesRef = useRef<HTMLDivElement>(null)
  const infoRef = useRef<HTMLSpanElement>(null)

  const MasteryImgWithCount = useMemo(
    () => getMasteryImgWithCount(t.common, masteriesCount),
    [masteriesCount, t],
  )

  return (
    <div className="relative flex w-full max-w-7xl flex-wrap items-center justify-between gap-6">
      <div className="flex flex-wrap gap-4">
        <img
          src={staticData.assets.summonerIcon(profileIconId)}
          alt={t.common.summonerIconAlt(RiotId.stringify(riotId))}
          className="size-24 rounded border border-goldenrod-bis"
        />
        <div className="grid grid-rows-[1fr_auto]">
          <div className="flex flex-wrap items-baseline gap-2">
            <div ref={nameRef} className="flex items-baseline gap-0.5 whitespace-pre">
              <span className="text-xl font-bold text-goldenrod">
                {GameName.unwrap(riotId.gameName)}
              </span>
              <span className="text-lg text-grey-500">#{TagLine.unwrap(riotId.tagLine)}</span>
            </div>
            <Tooltip hoverRef={nameRef} className="flex flex-col items-center">
              {pipe(
                maybeName,
                Maybe.fold(
                  () => null,
                  name => (
                    <div className="flex items-baseline gap-2">
                      <span>{t.common.oldSummonerName}</span>
                      <span className="whitespace-pre text-lg font-bold text-goldenrod">
                        {SummonerName.unwrap(name)}
                      </span>
                    </div>
                  ),
                ),
              )}
              <span className="text-grey-500">
                {t.summoner.masteriesCache.lastUpdate(DayJs.unwrap(masteries.insertedAt).toDate())}
              </span>
              <span className="text-grey-500">
                {t.summoner.masteriesCache.duration(prettyMs(masteries.cacheDuration))}
              </span>
            </Tooltip>
            <span className="text-grey-400">—</span>
            <span ref={levelRef}>{t.common.level(summonerLevel, 'font-semibold')}</span>
            <Tooltip hoverRef={levelRef} placement="right">
              {t.common.summonerLevel}
            </Tooltip>
          </div>
          <div className="flex flex-wrap gap-6">
            {SummonerLeaguesView.keys.map(queue => (
              <League key={queue} queue={queue} league={leagues[queue]} />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div ref={masteriesRef} className="flex items-end gap-3 pb-1">
          <MasteryImgWithCount level={10} imgClassName="!w-20" />
          <MasteryImgWithCount level={9} imgClassName="!w-20 -mt-0.5" className="-mb-1" />
          <MasteryImgWithCount level={8} imgClassName="!w-20 -mt-0.5" className="-mb-1" />
        </div>
        <Tooltip
          hoverRef={masteriesRef}
          className="flex flex-col items-center gap-2 px-5 pb-4 pt-3"
        >
          <div className="flex items-end justify-center gap-3">
            <MasteryImgWithCount level={7} />
            <MasteryImgWithCount level={6} />
            <MasteryImgWithCount level={5} imgClassName="-mt-1" className="-mx-0.5" />
            <MasteryImgWithCount level={4} imgClassName="-mt-1" className="-mx-1" />
            <MasteryImgWithCount level={3} imgClassName="-mt-1.5" className="-mx-1.5" />
            <MasteryImgWithCount level={2} imgClassName="-mt-1.5" className="-mx-2" />
            <MasteryImgWithCount level={1} imgClassName="-mt-2" className="-mx-2.5" />
            <MasteryImgWithCount level={0} imgClassName="-mt-2" className="-mx-4" />
          </div>
          <div className="grid grid-cols-[auto_auto] gap-x-2">
            <span className="justify-self-end">{t.summoner.masteryScore}</span>
            <span className="font-semibold">{t.common.number(totalMasteryLevel)}</span>

            <span className="mt-1 justify-self-end">{t.summoner.masteryPoints}</span>
            <span className="mt-1 font-semibold">
              {TranslationUtils.numberUnit(t.common)(totalMasteryPoints)}
            </span>

            <span className="mt-1 justify-self-end">{t.summoner.otpIndex}</span>
            <span className="mt-1 font-semibold">{t.common.number(otpIndex)}</span>
            <span className="col-span-2 whitespace-pre-wrap text-center text-xs italic opacity-70">
              {t.summoner.otpIndexExplanation}
            </span>
          </div>
        </Tooltip>
        <span className="flex items-center gap-2">
          <span>{t.summoner.percentsProgression(round(questPercents, 2), 'font-semibold')}</span>
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
  level: ChampionLevel
  imgClassName?: string
  className?: string
}

const getMasteryImgWithCount =
  (
    t: Translation['common'],
    masteriesCount: Dict<`${number}`, number>,
  ): React.FC<MasteryImgWithCountProps> =>
  ({ level, imgClassName, className }) => {
    const count = masteriesCount[ChampionLevel.stringify(level)]

    return (
      <div className={cx('flex flex-col items-center', className)}>
        <span className="text-sm font-semibold">{t.number(count ?? -1)}</span>
        <MasteryImg level={level} className={cx('w-[3.375rem]', imgClassName)} />
      </div>
    )
  }

function prettyMs(ms: MsDuration): number {
  const date = DayJs.of(MsDuration.unwrap(ms))
  const zero = DayJs.of(0)

  const m = pipe(date, DayJs.diff(zero, 'minutes'))
  const s = DayJs.second.get(date) / 60

  return m + s
}
