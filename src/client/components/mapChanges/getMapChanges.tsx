/* eslint-disable functional/no-expression-statements,
                  functional/no-return-void */
import { io, random, separated } from 'fp-ts'
import type { Separated } from 'fp-ts/Separated'
import { flow, identity, pipe } from 'fp-ts/function'
import { Fragment, useMemo, useRef } from 'react'

import type { WikiStatsBalanceKey } from '../../../shared/models/WikiStatsBalance'
import { WikiStatsBalance } from '../../../shared/models/WikiStatsBalance'
import type { ChampionSpellHtml, MapChangesData } from '../../../shared/models/api/MapChangesData'
import { SpellName } from '../../../shared/models/api/SpellName'
import { ChampionKey } from '../../../shared/models/api/champion/ChampionKey'
import { StaticDataChampion } from '../../../shared/models/api/staticData/StaticDataChampion'
import { ListUtils } from '../../../shared/utils/ListUtils'
import { StringUtils } from '../../../shared/utils/StringUtils'
import { Dict, Either, List, Maybe, NonEmptyArray } from '../../../shared/utils/fp'

import { ChampionCategoryTitle } from '../../components/ChampionCategoryTitle'
import { ChampionPositionsAndFactions } from '../../components/ChampionTooltip'
import { CroppedChampionSquare } from '../../components/CroppedChampionSquare'
import { SearchChampion } from '../../components/SearchChampion'
import { MainLayout } from '../../components/mainLayout/MainLayout'
import { Tooltip } from '../../components/tooltip/Tooltip'
import { useHistory } from '../../contexts/HistoryContext'
import { useStaticData } from '../../contexts/StaticDataContext'
import { useTranslation } from '../../contexts/TranslationContext'
import { Assets } from '../../imgs/Assets'
import { OpenInNew } from '../../imgs/svgs/icons'
import { MapChangesChampionCategory } from '../../models/MapChangesChampionCategory'
import { GenericQuery } from '../../models/genericQuery/GenericQuery'
import { cx } from '../../utils/cx'
import { MapChangesTooltip } from './MapChangesTooltip'

import './mapChanges.css'

const { cleanChampionName } = StringUtils

type EnrichedStaticDataChampion = StaticDataChampion & {
  isHidden: boolean
  category: MapChangesChampionCategory
}

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

                  <Champion getData={getData} champion={c} />
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

type ChampionProps = {
  getData: (c: StaticDataChampion) => MapChangesData
  champion: EnrichedStaticDataChampion
}

const Champion: React.FC<ChampionProps> = ({ getData, champion }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const championRef = useRef<HTMLDivElement>(null)

  const initialRef = useRef<HTMLDivElement>(null)
  const moreRef = useRef<HTMLDivElement>(null)

  const { left: initial, right: more } = useMemo(
    () => splitStatsAndSpells(getData(champion)),
    [champion, getData],
  )

  return (
    <div
      ref={containerRef}
      className={cx(
        'grid grid-cols-[auto_1fr] grid-rows-[auto_1fr] overflow-hidden rounded-lg bg-aram-stats text-2xs',
        MapChangesChampionCategory.fromData(getData(champion)) !== 'balanced'
          ? 'col-span-7'
          : 'col-span-4',
        ['hidden', champion.isHidden],
      )}
    >
      <CroppedChampionSquare
        ref={championRef}
        championKey={champion.key}
        championName={champion.name}
        className="size-12 rounded-lg shadow-even shadow-black"
      />
      <Tooltip hoverRef={championRef} placement="top" className="flex flex-col gap-1">
        <h3 className="self-center px-2 font-bold shadow-black text-shadow">{champion.name}</h3>
        <ChampionPositionsAndFactions positions={champion.positions} factions={champion.factions} />
      </Tooltip>

      {List.isNonEmpty(initial) && (
        <div ref={initialRef} className="row-span-2 grid place-items-center p-0.5">
          <ul>{initial}</ul>
        </div>
      )}
      {List.isNonEmpty(more) && (
        <div ref={moreRef} className="grid items-end justify-items-center p-0.5">
          <ul>{more}</ul>
        </div>
      )}
      <Tooltip hoverRef={[initialRef, moreRef]} placementRef={containerRef}>
        <MapChangesTooltip data={getData(champion)} />
      </Tooltip>
    </div>
  )
}

type StatProps = {
  name: WikiStatsBalanceKey
  value: number
}

const Stat: React.FC<StatProps> = ({ name, value }) => {
  const { t } = useTranslation('mapChanges')

  const isMalusStat = WikiStatsBalance.isMalusStat(name)
  const maybeUnit = WikiStatsBalance.isPercentsStat(name) ? Maybe.some('%') : Maybe.none

  const n = WikiStatsBalance.isModifierStat(name) ? (value * 1000 - 1000) / 10 : value

  return (
    <div className="grid grid-cols-[auto_1fr] items-center justify-items-start gap-1">
      <img
        src={Assets.stats[name]}
        alt={t.statIconAlt(name)}
        className="size-2.5 bg-contain brightness-75 sepia"
      />

      <span
        className={cx(
          'flex font-lib-mono',
          (isMalusStat ? 0 < n : n < 0) ? 'text-red' : 'text-green',
        )}
      >
        <span>
          {n < 0 ? null : '+'}
          {n}
        </span>
        {pipe(
          maybeUnit,
          Maybe.fold(
            () => null,
            u => <span>{u}</span>,
          ),
        )}
      </span>
    </div>
  )
}

type SpellProps = {
  spell: SpellName
  html: string
}

const Spell: React.FC<SpellProps> = ({ spell, html }) => {
  const { t } = useTranslation('common')

  return (
    <div className="flex items-center gap-1">
      <span dangerouslySetInnerHTML={{ __html: html }} className="wiki compact" />
      <span>{t.labels.spell[spell]}</span>
    </div>
  )
}

type Stat = {
  key: WikiStatsBalanceKey
  value: number
}

type Spell = {
  key: SpellName
  value: ChampionSpellHtml
}

function splitStatsAndSpells(
  data: MapChangesData,
): Separated<List<React.ReactElement>, List<React.ReactElement>> {
  const separated_: List<Maybe<NonEmptyArray<Either<Stat, Spell>>>> = pipe([
    pipe(
      data.stats,
      Maybe.chain(stats =>
        pipe(
          WikiStatsBalance.keys,
          List.filterMap(key =>
            pipe(
              Dict.lookup(key, stats),
              Maybe.map(value => Either.left({ key, value })),
            ),
          ),
          NonEmptyArray.fromReadonlyArray,
        ),
      ),
    ),
    pipe(
      data.spells,
      Maybe.chain(spells =>
        pipe(
          SpellName.values,
          List.filterMap(key =>
            pipe(
              Dict.lookup(key, spells),
              Maybe.map(value => Either.right({ key, value })),
            ),
          ),
          NonEmptyArray.fromReadonlyArray,
        ),
      ),
    ),
  ])

  return pipe(
    separated_,
    List.compact,
    List.chain(identity),
    splitWhileSmallerThanImage,
    evenOddRights,
    separated.bimap(toElement, toElement),
  )
}

// Must be aligned with CSS
const sizes = {
  image: 12,
  paddingY: 0.5,
  stat: 3,
  spell: 5,
}

function splitWhileSmallerThanImage(
  data: List<Either<Stat, Spell>>,
  accLeft: List<Either<Stat, Spell>> = [],
  accHeight: number = sizes.paddingY * 2,
): Separated<List<Either<Stat, Spell>>, List<Either<Stat, Spell>>> {
  const [head, ...tail] = data

  if (head === undefined) {
    return { left: accLeft, right: tail }
  }

  const newAccLeft = pipe(accLeft, List.append(head))

  const newAccHeight =
    accHeight +
    pipe(
      head,
      Either.fold(
        () => sizes.stat,
        () => sizes.spell,
      ),
    )

  if (newAccHeight > sizes.image) {
    return { left: newAccLeft, right: tail }
  }

  return splitWhileSmallerThanImage(tail, newAccLeft, newAccHeight)
}

function evenOddRights<A>({
  left,
  right,
}: Separated<List<A>, List<A>>): Separated<List<A>, List<A>> {
  const { left: odds, right: evens } = pipe(
    right,
    List.partitionWithIndex(i => i % 2 === 0),
  )

  return {
    left: pipe(left, List.concat(odds)),
    right: evens,
  }
}

const toElement = List.map(
  Either.fold<Stat, Spell, React.ReactElement>(
    ({ key, value }) => <Stat key={key} name={key} value={value} />,
    ({ key, value }) => <Spell key={key} spell={key} html={value.spell} />,
  ),
)
