/* eslint-disable functional/no-return-void */
import { ord, string } from 'fp-ts'
import type { Ord } from 'fp-ts/Ord'
import { flow, pipe } from 'fp-ts/function'
import { Fragment, useMemo, useRef } from 'react'

import { ChampionKey } from '../../../shared/models/api/champion/ChampionKey'
import type { StaticDataChampion } from '../../../shared/models/api/staticData/StaticDataChampion'
import { ListUtils } from '../../../shared/utils/ListUtils'
import { StringUtils } from '../../../shared/utils/StringUtils'
import { List, Maybe } from '../../../shared/utils/fp'

import { AramTooltip } from '../../components/AramTooltip'
import { ChampionCategoryTitle } from '../../components/ChampionCategoryTitle'
import { CroppedChampionSquare } from '../../components/CroppedChampionSquare'
import { SearchChampion } from '../../components/SearchChampion'
import { AramStatsCompact } from '../../components/aramStats/AramStatsCompact'
import { MainLayout } from '../../components/mainLayout/MainLayout'
import { Tooltip } from '../../components/tooltip/Tooltip'
import { useHistory } from '../../contexts/HistoryContext'
import { useStaticData } from '../../contexts/StaticDataContext'
import { ChampionCategory } from '../../models/ChampionCategory'
import { AramQuery } from '../../models/aramQuery/AramQuery'
import { cx } from '../../utils/cx'
import './Aram.css'

const { cleanChampionName } = StringUtils

type EnrichedStaticDataChampion = StaticDataChampion & {
  isHidden: boolean
  category: ChampionCategory
}

const ordByName: Ord<EnrichedStaticDataChampion> = pipe(
  string.Ord,
  ord.contramap((c: EnrichedStaticDataChampion) => StringUtils.cleanUTF8ToASCII(c.name)),
)

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
      List.sort(ordByName),
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
  const containerRef = useRef<HTMLDivElement>(null)

  const championHoverRef = useRef<HTMLDivElement>(null)

  const aramHoverRef1 = useRef<HTMLUListElement>(null)
  const aramHoverRef2 = useRef<HTMLUListElement>(null)
  const renderChildrenCompact = useMemo(
    () => getRenderChildrenCompact(aramHoverRef1, aramHoverRef2),
    [],
  )

  return (
    <div
      ref={containerRef}
      className={cx(
        'grid grid-cols-[auto_auto] grid-rows-[auto_1fr] overflow-hidden rounded-xl bg-aram-stats text-2xs',
        ChampionCategory.fromAramData(champion.aram) !== 'balanced' ? 'col-span-7' : 'col-span-4',
        ['hidden', champion.isHidden],
      )}
    >
      <CroppedChampionSquare
        ref={championHoverRef}
        championKey={champion.key}
        championName={champion.name}
        className="h-12 w-12 rounded-xl shadow-even shadow-black"
      />
      <Tooltip hoverRef={championHoverRef} placement="top">
        {champion.name}
      </Tooltip>

      <AramStatsCompact aram={champion.aram} splitAt={5}>
        {renderChildrenCompact}
      </AramStatsCompact>
      <Tooltip hoverRef={[aramHoverRef1, aramHoverRef2]} placementRef={containerRef}>
        <AramTooltip aram={champion.aram} />
      </Tooltip>
    </div>
  )
}

const getRenderChildrenCompact =
  (ref1: React.RefObject<HTMLUListElement>, ref2: React.RefObject<HTMLUListElement>) =>
  (children1: List<React.ReactElement>, children2: List<React.ReactElement>): React.ReactElement =>
    (
      <>
        <ul ref={ref1} className="row-span-2 flex flex-col justify-center p-0.5">
          {children1}
        </ul>
        <ul
          ref={ref2}
          className={cx('flex flex-col', ['px-1.5 py-0.5', List.isNonEmpty(children2)])}
        >
          {children2}
        </ul>
      </>
    )
