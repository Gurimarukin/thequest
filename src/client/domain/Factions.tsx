/* eslint-disable functional/no-return-void */
import { flow, pipe } from 'fp-ts/function'
import { lens } from 'monocle-ts'
import type React from 'react'
import { Fragment, useMemo, useRef } from 'react'

import { ChampionFactionOrNone } from '../../shared/models/api/champion/ChampionFaction'
import { ChampionKey } from '../../shared/models/api/champion/ChampionKey'
import { StaticDataChampion } from '../../shared/models/api/staticData/StaticDataChampion'
import { ListUtils } from '../../shared/utils/ListUtils'
import { StringUtils } from '../../shared/utils/StringUtils'
import { List, Maybe, NonEmptyArray, PartialDict } from '../../shared/utils/fp'

import { ChampionFactionTitle } from '../components/ChampionFactionTitle'
import { CroppedChampionSquare } from '../components/CroppedChampionSquare'
import { SearchChampion } from '../components/SearchChampion'
import { MainLayout } from '../components/mainLayout/MainLayout'
import { Tooltip } from '../components/tooltip/Tooltip'
import { useHistory } from '../contexts/HistoryContext'
import { useStaticData } from '../contexts/StaticDataContext'
import { CountWithTotal } from '../models/CountWithTotal'
import { GenericQuery } from '../models/genericQuery/GenericQuery'
import { cx } from '../utils/cx'

const { cleanChampionName, plural } = StringUtils

type EnrichedStaticDataChampion = StaticDataChampion & {
  isHidden: boolean
  faction: ChampionFactionOrNone
}

const enrichedStaticDataChampionFactionLens = pipe(
  lens.id<EnrichedStaticDataChampion>(),
  lens.prop('faction'),
)

type FactionOrNoneOrHidden = ChampionFactionOrNone | 'hidden'

export const Factions: React.FC = () => {
  const { genericQuery, updateGenericQuery } = useHistory()
  const { champions } = useStaticData()

  const { filteredAndSortedChampions, factionsCount, searchCount } = useMemo(() => {
    const sortedChampions = pipe(
      champions,
      List.map(
        (c): EnrichedStaticDataChampion => ({
          ...c,
          isHidden: !pipe(
            genericQuery.search,
            Maybe.every(search => cleanChampionName(c.name).includes(cleanChampionName(search))),
          ),
          faction: StaticDataChampion.getFaction(c.factions), // unused
        }),
      ),
      List.sort(StaticDataChampion.Ord.byName),
    )

    const grouped = pipe(
      sortedChampions,
      ListUtils.multipleGroupBy((c): NonEmptyArray<FactionOrNoneOrHidden> => {
        if (c.isHidden) return ['hidden']
        if (List.isNonEmpty(c.factions)) return c.factions
        return ['none']
      }),
      PartialDict.mapWithIndex((faction, champions_) =>
        pipe(
          champions_,
          NonEmptyArray.map(c =>
            faction === 'hidden' ? c : pipe(c, enrichedStaticDataChampionFactionLens.set(faction)),
          ),
        ),
      ),
    )

    const factionsCount_: PartialDict<ChampionFactionOrNone, CountWithTotal> = pipe(
      sortedChampions,
      ListUtils.multipleGroupBy(
        (c): NonEmptyArray<ChampionFactionOrNone> =>
          List.isNonEmpty(c.factions) ? c.factions : ['none'],
      ),
      PartialDict.map(
        (nea): CountWithTotal => ({
          count: nea.filter(c => !c.isHidden).length,
          total: nea.length,
        }),
      ),
    )

    return {
      filteredAndSortedChampions: pipe(
        ChampionFactionOrNone.values,
        List.reduce(List.empty<EnrichedStaticDataChampion>(), (acc, faction) =>
          pipe(acc, List.concat(grouped[faction] ?? [])),
        ),
        List.concat(grouped.hidden ?? []),
      ),
      factionsCount: factionsCount_,
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

  return (
    <MainLayout>
      <div className="flex h-full w-full flex-col overflow-y-auto px-2 pb-24 pt-3">
        <SearchChampion
          searchCount={searchCount}
          initialSearch={genericQuery.search}
          onChange={onSearchChange}
          className="self-center"
        />
        <div className="grid w-full grid-cols-[repeat(auto-fit,3rem)] items-start gap-2">
          {pipe(
            filteredAndSortedChampions,
            ListUtils.mapWithPrevious((maybePrev, c) => (
              <Fragment key={`${c.faction}${ChampionKey.unwrap(c.key)}`}>
                {!c.isHidden &&
                !pipe(
                  maybePrev,
                  Maybe.exists(prev => ChampionFactionOrNone.Eq.equals(prev.faction, c.faction)),
                ) ? (
                  <ChampionFactionTitle
                    challenges={Maybe.none}
                    count={factionsCount[c.faction] ?? CountWithTotal.empty}
                    faction={c.faction}
                    className="pt-3"
                  />
                ) : null}
                <Champion champion={c} />
              </Fragment>
            )),
          )}
        </div>
        <div className="self-center text-sm">
          {plural('champion')(searchCount)} / {champions.length}
        </div>
      </div>
    </MainLayout>
  )
}

type ChampionProps = {
  champion: EnrichedStaticDataChampion
}

const Champion: React.FC<ChampionProps> = ({ champion }) => {
  const hoverRef = useRef<HTMLDivElement>(null)

  return (
    <>
      <CroppedChampionSquare
        ref={hoverRef}
        championKey={champion.key}
        championName={champion.name}
        className={cx('h-12 w-12 rounded-xl shadow-even shadow-black', [
          'hidden',
          champion.isHidden,
        ])}
      />
      <Tooltip hoverRef={hoverRef} placement="top">
        {champion.name}
      </Tooltip>
    </>
  )
}
