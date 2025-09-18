/* eslint-disable functional/no-expression-statements,
                  functional/no-return-void */
import { io, random } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import { Fragment, useMemo } from 'react'

import type { MapChangesData } from '../../../shared/models/api/MapChangesData'
import { ChampionKey } from '../../../shared/models/api/champion/ChampionKey'
import { StaticDataChampion } from '../../../shared/models/api/staticData/StaticDataChampion'
import { ListUtils } from '../../../shared/utils/ListUtils'
import { StringUtils } from '../../../shared/utils/StringUtils'
import { List, Maybe, NonEmptyArray } from '../../../shared/utils/fp'

import { ChampionCategoryTitle } from '../../components/ChampionCategoryTitle'
import { SearchChampion } from '../../components/SearchChampion'
import { MainLayout } from '../../components/mainLayout/MainLayout'
import { useHistory } from '../../contexts/HistoryContext'
import { useStaticData } from '../../contexts/StaticDataContext'
import { useTranslation } from '../../contexts/TranslationContext'
import { OpenInNew } from '../../imgs/svgs/icons'
import { MapChangesChampionCategory } from '../../models/MapChangesChampionCategory'
import { GenericQuery } from '../../models/genericQuery/GenericQuery'
import type { EnrichedStaticDataChampion } from './ChampionSquareChanges'
import { ChampionSquareChanges } from './ChampionSquareChanges'

import './mapChanges.css'

const { cleanChampionName } = StringUtils

type CategoryOrHidden = MapChangesChampionCategory | 'hidden'

export const getMapChanges =
  (wikiLink: string, getData: (c: StaticDataChampion) => MapChangesData): React.FC =>
  () => {
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
            category: MapChangesChampionCategory.fromData(getData(c)),
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
          MapChangesChampionCategory.values,
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

          <div className="grid w-full grid-cols-[repeat(auto-fit,1px)] items-start gap-x-3.75 gap-y-1">
            {pipe(
              filteredAndSortedChampions,
              ListUtils.mapWithPrevious((maybePrev, c) => (
                <Fragment key={ChampionKey.unwrap(c.key)}>
                  {!c.isHidden &&
                  !pipe(
                    maybePrev,
                    Maybe.exists(prev =>
                      MapChangesChampionCategory.Eq.equals(prev.category, c.category),
                    ),
                  ) ? (
                    <ChampionCategoryTitle category={c.category} className="pt-4" />
                  ) : null}

                  <ChampionSquareChanges getData={getData} champion={c} />
                </Fragment>
              )),
            )}
          </div>

          <div className="mt-6 self-center">
            {t.nChampionsFraction(searchCount, champions.length)}
          </div>

          <span className="mt-24 flex items-center gap-2 self-center text-sm">
            <OpenInNew className="invisible size-3.5" /> {/* for hitbox */}
            <a
              href={wikiLink}
              target="_blank"
              rel="noreferrer"
              className="peer border-b border-b-wheat/50 transition-all duration-100 hover:border-b-goldenrod"
            >
              {wikiLink}
            </a>
            <OpenInNew className="invisible size-3.5 opacity-0 transition-all duration-100 peer-hover:visible peer-hover:opacity-100" />
          </span>
        </div>
      </MainLayout>
    )
  }
