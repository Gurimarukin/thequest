/* eslint-disable functional/no-return-void */
import { flow, pipe } from 'fp-ts/function'
import { Fragment, useMemo, useRef } from 'react'

import type { StaticDataChampion } from '../../../shared/models/api/StaticDataChampion'
import { ChampionKey } from '../../../shared/models/api/champion/ChampionKey'
import { ListUtils } from '../../../shared/utils/ListUtils'
import { StringUtils } from '../../../shared/utils/StringUtils'
import { List, Maybe } from '../../../shared/utils/fp'

import { ChampionCategoryTitle } from '../../components/ChampionCategoryTitle'
import { SearchChampion } from '../../components/SearchChampion'
import { AramStatsCompact } from '../../components/aramStats/AramStatsCompact'
import { AramStatsFull } from '../../components/aramStats/AramStatsFull'
import { MainLayout } from '../../components/mainLayout/MainLayout'
import { Tooltip } from '../../components/tooltip/Tooltip'
import { useHistory } from '../../contexts/HistoryContext'
import { useStaticData } from '../../contexts/StaticDataContext'
import { ChampionCategory } from '../../models/ChampionCategory'
import { AramQuery } from '../../models/aramQuery/AramQuery'
import { cssClasses } from '../../utils/cssClasses'
import './Aram.css'

const { cleanChampionName } = StringUtils

type EnrichedStaticDataChampion = StaticDataChampion & {
  isHidden: boolean
  category: ChampionCategory
}

export const Aram: React.FC = () => {
  const { aramQuery, updateAramQuery } = useHistory()
  const { champions } = useStaticData()

  const { filteredAndSortedChampions, searchCount } = useMemo(() => {
    const grouped = pipe(
      champions,
      List.map(
        (c): EnrichedStaticDataChampion => ({
          ...c,
          isHidden: !pipe(
            aramQuery.search,
            Maybe.every(search => cleanChampionName(c.name).includes(cleanChampionName(search))),
          ),
          category: ChampionCategory.fromAramData(c.aram),
        }),
      ),
      List.groupBy((a): ChampionCategory | 'hidden' => (a.isHidden ? 'hidden' : a.category)),
    )

    const filteredAndSortedChampions_ = pipe(
      ChampionCategory.values,
      List.reduce(List.empty<EnrichedStaticDataChampion>(), (acc, category) =>
        pipe(acc, List.concat(grouped[category] ?? [])),
      ),
      List.concat(grouped.hidden ?? []),
    )

    return {
      filteredAndSortedChampions: filteredAndSortedChampions_,
      searchCount: pipe(
        filteredAndSortedChampions_,
        List.filter(c => !c.isHidden),
        List.size,
      ),
    }
  }, [aramQuery.search, champions])

  const onSearchChange = useMemo(
    (): ((search_: Maybe<string>) => void) => flow(AramQuery.Lens.search.set, updateAramQuery),
    [updateAramQuery],
  )

  return (
    <MainLayout>
      <div className="flex h-full w-full flex-col overflow-y-auto px-2 pb-24 pt-3">
        <SearchChampion
          searchCount={searchCount}
          initialSearch={aramQuery.search}
          onChange={onSearchChange}
          className="self-center"
        />
        <div className="grid w-full grid-cols-[repeat(auto-fit,1px)] items-start gap-x-[15px] gap-y-1">
          {pipe(
            filteredAndSortedChampions,
            ListUtils.mapWithPrevious((maybePrev, c) => (
              <Fragment key={ChampionKey.unwrap(c.key)}>
                {!c.isHidden &&
                !pipe(
                  maybePrev,
                  Maybe.exists(prev => ChampionCategory.Eq.equals(prev.category, c.category)),
                ) ? (
                  <ChampionCategoryTitle category={c.category} className="pt-4" />
                ) : null}
                <Champion champion={c} />
              </Fragment>
            )),
          )}
        </div>
      </div>
    </MainLayout>
  )
}

type ChampionProps = {
  champion: EnrichedStaticDataChampion
}

const Champion: React.FC<ChampionProps> = ({ champion }) => {
  const { assets } = useStaticData()
  const hoverRef = useRef<HTMLDivElement>(null)

  return (
    <>
      <div
        ref={hoverRef}
        className={cssClasses(
          'grid grid-cols-[auto_auto] grid-rows-[auto_1fr] rounded-xl bg-zinc-800 text-2xs',
          ChampionCategory.fromAramData(champion.aram) !== 'balanced' ? 'col-span-7' : 'col-span-4',
          ['hidden', champion.isHidden],
        )}
      >
        <div className="h-12 w-12 overflow-hidden rounded-xl shadow-even shadow-black">
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
  children1: List<React.JSX.Element>,
  children2: List<React.JSX.Element>,
): React.JSX.Element => (
  <>
    <ul className="row-span-2 flex flex-col self-center p-0.5">{children1}</ul>
    {List.isNonEmpty(children2) ? (
      <ul className="flex flex-col self-start py-0.5 px-1.5">{children2}</ul>
    ) : null}
  </>
)

const renderChildrenFull = (children1: List<React.JSX.Element>): React.JSX.Element => (
  <ul className="grid grid-cols-[auto_auto_1fr] items-center gap-y-1">{children1}</ul>
)
