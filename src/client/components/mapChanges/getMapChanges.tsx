/* eslint-disable functional/no-expression-statements,
                  functional/no-return-void */
import { io, random } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import { Fragment, useMemo, useRef } from 'react'

import { ChampionKey } from '../../../shared/models/api/champion/ChampionKey'
import { StaticDataChampion } from '../../../shared/models/api/staticData/StaticDataChampion'
import { ListUtils } from '../../../shared/utils/ListUtils'
import { StringUtils } from '../../../shared/utils/StringUtils'
import { List, Maybe, NonEmptyArray } from '../../../shared/utils/fp'

import { AramTooltip } from '../../components/AramTooltip'
import { ChampionCategoryTitle } from '../../components/ChampionCategoryTitle'
import { ChampionPositionsAndFactions } from '../../components/ChampionTooltip'
import { CroppedChampionSquare } from '../../components/CroppedChampionSquare'
import { SearchChampion } from '../../components/SearchChampion'
import { AramStatsCompact } from '../../components/aramStats/AramStatsCompact'
import { MainLayout } from '../../components/mainLayout/MainLayout'
import { Tooltip } from '../../components/tooltip/Tooltip'
import { useHistory } from '../../contexts/HistoryContext'
import { useStaticData } from '../../contexts/StaticDataContext'
import { useTranslation } from '../../contexts/TranslationContext'
import { ChampionAramCategory } from '../../models/ChampionAramCategory'
import { GenericQuery } from '../../models/genericQuery/GenericQuery'
import { cx } from '../../utils/cx'
import './mapChanges.css'

const { cleanChampionName } = StringUtils

type EnrichedStaticDataChampion = StaticDataChampion & {
  isHidden: boolean
  category: ChampionAramCategory
}

type CategoryOrHidden = ChampionAramCategory | 'hidden'

export const getMapChanges = (): React.FC => () => {
  const { genericQuery, updateGenericQuery } = useHistory()
  const { t } = useTranslation('common')
  const { champions } = useStaticData()

  const { filteredAndSortedChampions, searchCount } = useMemo(() => {
    const sortedChampions = pipe(
      champions,
      List.map(
        (c): EnrichedStaticDataChampion => ({
          ...c,
          isHidden: !pipe(
            genericQuery.search,
            Maybe.every(search => cleanChampionName(c.name).includes(cleanChampionName(search))),
          ),
          category: ChampionAramCategory.fromAramData(c.aram),
        }),
      ),
      List.sort(StaticDataChampion.Ord.byName),
    )

    const grouped = pipe(
      sortedChampions,
      List.groupBy((a): CategoryOrHidden => (a.isHidden ? 'hidden' : a.category)),
    )

    return {
      filteredAndSortedChampions: pipe(
        ChampionAramCategory.values,
        List.reduce(List.empty<EnrichedStaticDataChampion>(), (acc, category) =>
          pipe(acc, List.concat(grouped[category] ?? [])),
        ),
        List.concat(grouped.hidden ?? []),
      ),
      searchCount: pipe(
        sortedChampions,
        List.filter(c => !c.isHidden),
        List.size,
      ),
    }
  }, [champions, genericQuery.search])

  const onSearchChange = useMemo(
    (): ((search_: Maybe<string>) => void) =>
      flow(GenericQuery.Lens.search.set, updateGenericQuery),
    [updateGenericQuery],
  )

  const randomChampion = useMemo(
    (): Maybe<() => string> =>
      pipe(
        filteredAndSortedChampions,
        NonEmptyArray.fromReadonlyArray,
        Maybe.map(
          flow(
            random.randomElem,
            io.map(m => {
              updateGenericQuery(GenericQuery.Lens.search.set(Maybe.some(m.name)))
              return m.name
            }),
          ),
        ),
      ),
    [filteredAndSortedChampions, updateGenericQuery],
  )

  return (
    <MainLayout>
      <div className="flex size-full flex-col overflow-y-auto px-2 pb-24 pt-3">
        <SearchChampion
          searchCount={searchCount}
          randomChampion={randomChampion}
          initialSearch={genericQuery.search}
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
                  Maybe.exists(prev => ChampionAramCategory.Eq.equals(prev.category, c.category)),
                ) ? (
                  <ChampionCategoryTitle category={c.category} className="pt-4" />
                ) : null}
                <Champion champion={c} />
              </Fragment>
            )),
          )}
        </div>
        <div className="mt-6 self-center">
          {t.nChampionsFraction(searchCount, champions.length)}
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
        ChampionAramCategory.fromAramData(champion.aram) !== 'balanced'
          ? 'col-span-7'
          : 'col-span-4',
        ['hidden', champion.isHidden],
      )}
    >
      <CroppedChampionSquare
        ref={championHoverRef}
        championKey={champion.key}
        championName={champion.name}
        className="size-12 rounded-xl shadow-even shadow-black"
      />
      <Tooltip hoverRef={championHoverRef} placement="top" className="flex flex-col gap-1">
        <h3 className="self-center px-2 font-bold shadow-black text-shadow">{champion.name}</h3>
        <ChampionPositionsAndFactions positions={champion.positions} factions={champion.factions} />
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
  (
    children1: List<React.ReactElement>,
    children2: List<React.ReactElement>,
  ): React.ReactElement => (
    <>
      <ul ref={ref1} className="row-span-2 flex flex-col justify-center p-0.5">
        {children1}
      </ul>
      <ul ref={ref2} className={cx('flex flex-col', ['px-1.5 py-0.5', List.isNonEmpty(children2)])}>
        {children2}
      </ul>
    </>
  )
