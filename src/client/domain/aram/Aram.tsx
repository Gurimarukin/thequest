import { pipe } from 'fp-ts/function'
import React, { useMemo, useRef } from 'react'

import type { StaticDataChampion } from '../../../shared/models/api/StaticDataChampion'
import { ChampionKey } from '../../../shared/models/api/champion/ChampionKey'
import type { NonEmptyArray } from '../../../shared/utils/fp'
import { List } from '../../../shared/utils/fp'

import { AramStatsCompact } from '../../components/aramStats/AramStatsCompact'
import { AramStatsFull } from '../../components/aramStats/AramStatsFull'
import { MainLayout } from '../../components/mainLayout/MainLayout'
import { Tooltip } from '../../components/tooltip/Tooltip'
import { useStaticData } from '../../contexts/StaticDataContext'
import { ChampionCategory } from '../../models/ChampionCategory'
import { cssClasses } from '../../utils/cssClasses'
import './Aram.css'

export const Aram = (): JSX.Element => {
  const { champions } = useStaticData()

  const categories = useMemo(() => ChampionCategory.groupChampions(champions), [champions])

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

type ChampionsProps = {
  title: React.ReactNode
  className?: string
  children: NonEmptyArray<StaticDataChampion> | undefined
}

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
        className="grid grid-cols-[auto_auto] grid-rows-[auto_1fr] overflow-hidden rounded-tr-xl rounded-bl-xl border-b border-r border-goldenrod-secondary bg-zinc-900 text-2xs"
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
    <ul className="row-span-2 flex flex-col self-center py-0.5 px-1.5">{children1}</ul>
    {List.isNonEmpty(children2) ? (
      <ul className="flex flex-col self-start py-0.5 px-1.5">{children2}</ul>
    ) : null}
  </>
)

const renderChildrenFull = (children1: List<JSX.Element>): JSX.Element => (
  <ul className="grid grid-cols-[auto_auto_1fr] items-center gap-y-1">{children1}</ul>
)
