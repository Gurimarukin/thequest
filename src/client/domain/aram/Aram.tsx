import { monoid, number } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import React, { useMemo, useRef } from 'react'

import type { StaticDataChampion } from '../../../shared/models/api/StaticDataChampion'
import { ChampionKey } from '../../../shared/models/api/champion/ChampionKey'
import { WikiaStatsBalance } from '../../../shared/models/wikia/WikiaStatsBalance'
import type { NonEmptyArray } from '../../../shared/utils/fp'
import { List, Maybe, PartialDict } from '../../../shared/utils/fp'

import { AramStatsCompact } from '../../components/aramStats/AramStatsCompact'
import { AramStatsFull } from '../../components/aramStats/AramStatsFull'
import { MainLayout } from '../../components/mainLayout/MainLayout'
import { Tooltip } from '../../components/tooltip/Tooltip'
import { useStaticData } from '../../contexts/StaticDataContext'
import { cssClasses } from '../../utils/cssClasses'
import './Aram.css'

type ChampionCategory = 'buffed' | 'nerfed' | 'other' | 'balanced'

export const Aram = (): JSX.Element => {
  const { champions } = useStaticData()

  const categories = useMemo(
    () =>
      pipe(
        champions,
        List.groupBy(
          (c): ChampionCategory =>
            pipe(
              c.aram.stats,
              Maybe.map((stats): ChampionCategory => {
                const normalized = normalizeStats(stats)
                return normalized < 0 ? 'nerfed' : 0 < normalized ? 'buffed' : 'other'
              }),
              Maybe.getOrElse(() =>
                pipe(
                  c.aram.spells,
                  Maybe.fold<unknown, ChampionCategory>(
                    () => 'balanced',
                    () => 'other',
                  ),
                ),
              ),
            ),
        ),
      ),
    [champions],
  )

  return (
    <MainLayout>
      <div className="h-full w-full overflow-y-auto">
        <div className="grid grid-cols-2 p-3">
          <Champions title="Champions buffés">{categories.buffed}</Champions>
          <Champions title="Champions nerfés" className="border-l border-goldenrod">
            {categories.nerfed}
          </Champions>
          <Champions title="Autres" className="col-span-2 border-t border-goldenrod">
            {categories.other}
          </Champions>
          <Champions
            title="Champions parfaitement équilibrés"
            className="col-span-2 border-t border-goldenrod"
          >
            {categories.balanced}
          </Champions>
        </div>
      </div>
    </MainLayout>
  )
}

const normalizeStats = (stats: WikiaStatsBalance): number =>
  pipe(
    stats,
    PartialDict.toReadonlyArray,
    List.map(([key, val]): number => {
      if (val === undefined || val === 0) return 0

      return (
        ((WikiaStatsBalance.isModifierStat(key) ? val - 1 : val) < 0 ? -1 : 1) *
        (WikiaStatsBalance.isMalusStat(key) ? -1 : 1)
      )
    }),
    monoid.concatAll(number.MonoidSum),
  )

type ChampionsProps = {
  title: React.ReactNode
  className?: string
  children: NonEmptyArray<StaticDataChampion> | undefined
}

const commonClassName = 'gap-y-[1px]'

const Champions = ({ title, className, children }: ChampionsProps): JSX.Element => (
  <div className={cssClasses('flex flex-wrap content-start items-center gap-1 p-3', className)}>
    <h2 className="w-full text-sm">{title}</h2>
    {children !== undefined
      ? pipe(
          children,
          List.map(c => <Champion key={ChampionKey.unwrap(c.key)} champion={c} />),
        )
      : null}
  </div>
)

type ChampionProps = {
  champion: StaticDataChampion
}

const Champion = ({ champion }: ChampionProps): JSX.Element => {
  const { assets } = useStaticData()
  const hoverRef = useRef<HTMLDivElement>(null)

  return (
    <>
      <div
        ref={hoverRef}
        className={cssClasses(
          commonClassName,
          'grid grid-cols-[auto_auto] grid-rows-[auto_1fr] gap-x-1.5 overflow-hidden rounded-tr-xl rounded-bl-xl border-b border-r border-goldenrod-secondary bg-zinc-900 text-2xs',
        )}
      >
        <div className="h-12 w-12 overflow-hidden">
          <img
            src={assets.champion.square(champion.key)}
            alt={`Icône de ${champion.name}`}
            className="m-[-3px] w-[calc(100%_+_6px)] max-w-none"
          />
        </div>
        <AramStatsCompact aram={champion.aram}>{renderChildrenCompact}</AramStatsCompact>
      </div>
      <Tooltip hoverRef={hoverRef} className="max-w-md">
        <AramStatsFull aram={champion.aram}>{renderChildrenFull}</AramStatsFull>
      </Tooltip>
    </>
  )
}

const renderChildrenCompact = (
  children1: List<JSX.Element>,
  children2: List<JSX.Element>,
): JSX.Element => (
  <>
    <ul
      className={cssClasses(commonClassName, 'row-span-2 flex flex-col self-center py-0.5 pr-1.5')}
    >
      {children1}
    </ul>
    {List.isNonEmpty(children2) ? (
      <ul className={cssClasses(commonClassName, 'flex flex-col self-start py-0.5 pl-1.5')}>
        {children2}
      </ul>
    ) : null}
  </>
)

const renderChildrenFull = (children1: List<JSX.Element>): JSX.Element => (
  <ul className="grid grid-cols-[auto_auto_1fr] items-center gap-y-1">{children1}</ul>
)
