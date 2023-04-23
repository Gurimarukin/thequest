import { pipe } from 'fp-ts/function'
import React, { useMemo, useRef } from 'react'

import type { StaticDataChampion } from '../../../shared/models/api/StaticDataChampion'
import { ChampionKey } from '../../../shared/models/api/champion/ChampionKey'
import type { NonEmptyArray, PartialDict } from '../../../shared/utils/fp'
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

  const Champions = useMemo(() => getChampions(categories), [categories])

  return (
    <MainLayout>
      <div className="h-full w-full overflow-y-auto">
        <div className="grid grid-cols-2 gap-3 p-3">
          <Champions category="buffed" />
          <Champions category="nerfed" />
          <Champions category="other" className="col-span-2" />
          <Champions category="balanced" className="col-span-2" />
        </div>
      </div>
    </MainLayout>
  )
}

type ChampionsProps = {
  category: ChampionCategory
  className?: string
}

const getChampions =
  (categories: PartialDict<ChampionCategory, NonEmptyArray<StaticDataChampion>>) =>
  ({ category, className }: ChampionsProps): JSX.Element => {
    const champions = categories[category]
    return (
      <div
        className={cssClasses(
          'grid w-full grid-cols-[repeat(auto-fit,48px)] content-start items-start gap-x-4 gap-y-1',
          className,
        )}
      >
        <h2 className="col-span-full w-full pb-1 text-sm">{ChampionCategory.label[category]}</h2>
        {champions !== undefined
          ? pipe(
              champions,
              List.map(c => <Champion key={ChampionKey.unwrap(c.key)} champion={c} />),
            )
          : null}
      </div>
    )
  }

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
          'grid grid-cols-[auto_auto] grid-rows-[auto_1fr] overflow-hidden rounded-xl bg-zinc-800 text-2xs',
          ChampionCategory.fromAramData(champion.aram) !== 'balanced' ? 'col-span-2' : 'col-span-1',
        )}
      >
        <div className="h-12 w-12 overflow-hidden">
          <img
            src={assets.champion.square(champion.key)}
            alt={`Icône de ${champion.name}`}
            className="m-[-3px] w-[calc(100%_+_6px)] max-w-none"
          />
        </div>
        <AramStatsCompact aram={champion.aram} splitAt={5}>
          {renderChildrenCompact}
        </AramStatsCompact>
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
