import { number, ord, readonlySet, string } from 'fp-ts'
import type { Ord } from 'fp-ts/Ord'
import { flow, pipe } from 'fp-ts/function'
import { lens } from 'monocle-ts'
import React, { Fragment, useCallback, useMemo } from 'react'

import { ChampionKey } from '../../../shared/models/api/ChampionKey'
import { ChampionLevelOrZero } from '../../../shared/models/api/ChampionLevel'
import type { ChampionMasteryView } from '../../../shared/models/api/ChampionMasteryView'
import { List, Maybe, NonEmptyArray } from '../../../shared/utils/fp'

import { useHistory } from '../../contexts/HistoryContext'
import { useStaticData } from '../../contexts/StaticDataContext'
import { Assets } from '../../imgs/Assets'
import { MasteriesQuery } from '../../models/masteriesQuery/MasteriesQuery'
import type { MasteriesQueryView } from '../../models/masteriesQuery/MasteriesQueryView'
import { cssClasses } from '../../utils/cssClasses'

type Props = {
  readonly masteries: List<EnrichedChampionMasteryView>
}

export type EnrichedChampionMasteryView = Omit<ChampionMasteryView, 'championLevel'> & {
  readonly championLevel: ChampionLevelOrZero
  readonly name: string
  readonly percents: number
}

export const Masteries = ({ masteries }: Props): JSX.Element => {
  const { masteriesQuery } = useHistory()

  const filteredAndSortedChampions = useMemo(() => {
    return pipe(
      masteries,
      List.filter(levelFilterPredicate(masteriesQuery.level)),
      List.sortBy(
        ((): List<Ord<EnrichedChampionMasteryView>> => {
          switch (masteriesQuery.sort) {
            case 'percents':
              return [
                reverseIfDesc(ordByPercents),
                /* TODO: ordByFragment, */
                reverseIfDesc(ordByPoints),
                ordByName,
              ]
            case 'points':
              return [reverseIfDesc(ordByPoints), ordByName]
          }
        })(),
      ),
    )

    function reverseIfDesc<A>(o: Ord<A>): Ord<A> {
      switch (masteriesQuery.order) {
        case 'asc':
          return o
        case 'desc':
          return ord.reverse(o)
      }
    }
  }, [masteries, masteriesQuery.level, masteriesQuery.order, masteriesQuery.sort])

  return (
    <div className="flex flex-col">
      <Filters />
      {renderChampionMasteries(masteriesQuery.view, filteredAndSortedChampions)}
    </div>
  )
}

const levelFilterPredicate =
  (levels: ReadonlySet<ChampionLevelOrZero>) =>
  (c: EnrichedChampionMasteryView): boolean =>
    readonlySet.elem(ChampionLevelOrZero.Eq)(c.championLevel, levels)

const renderChampionMasteries = (
  view: MasteriesQueryView,
  champions: List<EnrichedChampionMasteryView>,
): JSX.Element => {
  switch (view) {
    case 'compact':
      return <ChampionMasteriesCompact champions={champions} />
    case 'histogram':
      return <ChampionMasteriesHistogram champions={champions} />
  }
}

const sortName = 'sort'
const orderName = 'order'
const viewName = 'view'

const Filters = (): JSX.Element => {
  const { masteriesQuery, updateMasteriesQuery } = useHistory()

  const u = (f: (q: MasteriesQuery) => MasteriesQuery) => () => updateMasteriesQuery(f)
  const setSort = flow(MasteriesQuery.Lens.sort.set, u)
  const setOrder = flow(MasteriesQuery.Lens.order.set, u)
  const setView = flow(MasteriesQuery.Lens.view.set, u)

  const toggleChecked = (level: ChampionLevelOrZero) => (e: React.ChangeEvent<HTMLInputElement>) =>
    updateMasteriesQuery(
      pipe(
        MasteriesQuery.Lens.level,
        lens.modify(
          e.target.checked
            ? readonlySet.insert(ChampionLevelOrZero.Eq)(level)
            : readonlySet.remove(ChampionLevelOrZero.Eq)(level),
        ),
      ),
    )

  return (
    <div className="border-b border-goldenrod">
      <div className="flex justify-between gap-5 flex-wrap">
        <div className="flex gap-3">
          <label className="flex gap-1">
            <input
              type="radio"
              name={sortName}
              checked={masteriesQuery.sort === 'percents'}
              onClick={setSort('percents')}
            />
            <span>Trier par %</span>
          </label>
          <label className="flex gap-1">
            <input
              type="radio"
              name={sortName}
              checked={masteriesQuery.sort === 'points'}
              onClick={setSort('points')}
            />
            <span>Trier par points</span>
          </label>
        </div>
        <div className="flex gap-3">
          <label className="flex gap-1">
            <input
              type="radio"
              name={orderName}
              checked={masteriesQuery.order === 'desc'}
              onClick={setOrder('desc')}
            />
            <span>Décroissant</span>
          </label>
          <label className="flex gap-1">
            <input
              type="radio"
              name={orderName}
              checked={masteriesQuery.order === 'asc'}
              onClick={setOrder('asc')}
            />
            <span>Croissant</span>
          </label>
        </div>
        <div className="flex gap-3">
          <label className="flex gap-1">
            <input
              type="radio"
              name={viewName}
              checked={masteriesQuery.view === 'compact'}
              onClick={setView('compact')}
            />
            <span>Vue compacte</span>
          </label>
          <label className="flex gap-1">
            <input
              type="radio"
              name={viewName}
              checked={masteriesQuery.view === 'histogram'}
              onClick={setView('histogram')}
            />
            <span>Vue histogramme</span>
          </label>
        </div>
      </div>
      <div className="flex gap-3">
        Maîtrises
        {pipe(
          ChampionLevelOrZero.values,
          List.reverse,
          List.map(level => (
            <label key={level} className="flex gap-1">
              <input
                type="checkbox"
                checked={readonlySet.elem(ChampionLevelOrZero.Eq)(level, masteriesQuery.level)}
                onChange={toggleChecked(level)}
              />
              <span>{level}</span>
            </label>
          )),
        )}
      </div>
    </div>
  )
}

type ChampionMasteriesCompactProps = {
  readonly champions: List<EnrichedChampionMasteryView>
}

const ChampionMasteriesCompact = ({ champions }: ChampionMasteriesCompactProps): JSX.Element => (
  <div className="flex flex-wrap gap-4 pt-4 pb-2">
    {champions.map(champion => (
      <ChampionMasterySquare key={ChampionKey.unwrap(champion.championId)} champion={champion} />
    ))}
  </div>
)

type ChampionMasteriesHistogramProps = {
  readonly champions: List<EnrichedChampionMasteryView>
}

const ChampionMasteriesHistogram = ({
  champions,
}: ChampionMasteriesHistogramProps): JSX.Element => {
  const maybeMaxPoints = useMemo(
    () =>
      pipe(
        champions,
        NonEmptyArray.fromReadonlyArray,
        Maybe.map(
          flow(
            NonEmptyArray.map(c => c.championPoints + c.championPointsUntilNextLevel),
            NonEmptyArray.max(number.Ord),
          ),
        ),
      ),
    [champions],
  )

  return (
    <div className="self-center w-full max-w-7xl grid grid-cols-[auto_1fr] gap-y-2 pt-4 pb-2">
      {champions.map(champion => (
        <Fragment key={ChampionKey.unwrap(champion.championId)}>
          <ChampionMasterySquare champion={champion} />
          <ChampionMasteryHistogram maybeMaxPoints={maybeMaxPoints} champion={champion} />
        </Fragment>
      ))}
    </div>
  )
}

type ChampionMasterySquareProps = {
  readonly champion: EnrichedChampionMasteryView
}

const ChampionMasterySquare = ({
  champion: { championId, championLevel, chestGranted, tokensEarned, name, percents },
}: ChampionMasterySquareProps): JSX.Element => {
  const staticData = useStaticData()

  const nameLevelTokens = `${name} - niveau ${championLevel}${
    championLevel === 5 || championLevel === 6
      ? ` - ${tokensEarned} jeton${tokensEarned < 2 ? '' : 's'}`
      : ''
  }\n${Math.round(percents)}%`

  return (
    <div
      className={cssClasses(
        'w-16 h-16 relative flex items-center justify-center',
        ['bg-mastery7-blue', championLevel === 7],
        ['bg-mastery6-violet', championLevel === 6],
        ['bg-mastery5-red', championLevel === 5],
        ['bg-mastery4-brown', championLevel === 4],
        ['bg-mastery-beige', championLevel < 4],
      )}
      title={name}
    >
      <div className="w-12 h-12 overflow-hidden">
        <img
          src={staticData.assets.champion.square(championId)}
          alt={`${name}'s icon`}
          className="max-w-none w-[calc(100%_+_6px)] m-[-3px]"
        />
      </div>
      <div
        className="absolute top-0 left-0 w-[14px] h-4 text-xs bg-black flex justify-center pr-[2px] rounded-br-lg overflow-hidden"
        title={nameLevelTokens}
      >
        <span className="mt-[-2px]">{championLevel}</span>
      </div>
      <Tokens championLevel={championLevel} tokensEarned={tokensEarned} title={nameLevelTokens} />
      {chestGranted ? (
        <div className="h-[15px] w-[18px] absolute left-0 bottom-0 bg-black flex flex-col-reverse rounded-tr">
          <img src={Assets.chest} alt="Chest icon" className="w-4" />
        </div>
      ) : null}
    </div>
  )
}

type ChampionMasteryHistogramProps = {
  readonly maybeMaxPoints: Maybe<number>
  readonly champion: EnrichedChampionMasteryView
}

const ChampionMasteryHistogram = ({
  maybeMaxPoints,
  champion: {
    championLevel,
    championPoints,
    championPointsSinceLastLevel,
    championPointsUntilNextLevel,
  },
}: ChampionMasteryHistogramProps): JSX.Element => {
  const pointsUntilAndSince = pipe(
    [
      Maybe.some(pointsStr(championPoints)),
      2 < championLevel
        ? Maybe.some(
            `${pointsStr(championPointsSinceLastLevel)} depuis le niveau ${Math.min(
              championLevel,
              5,
            )}`,
          )
        : Maybe.none,
      0 < championLevel && championLevel < 5
        ? Maybe.some(
            `${pointsStr(championPointsUntilNextLevel)} jusqu'au niveau ${championLevel + 1}`,
          )
        : Maybe.none,
    ],
    List.compact,
    List.mkString(' - '),
  )

  return (
    <div className="flex flex-col">
      {pipe(
        maybeMaxPoints,
        Maybe.fold(
          () => null,
          maxPoints => {
            const p = (n: number): string => `${Math.round((100 * n) / maxPoints)}%`
            return (
              <div className="h-7 relative">
                {championPointsUntilNextLevel === 0 ? null : (
                  <div
                    title={pointsUntilAndSince}
                    className="h-full bg-gray-600 opacity-50"
                    style={{ width: p(championPoints + championPointsUntilNextLevel) }}
                  />
                )}
                <div
                  title={pointsUntilAndSince}
                  className={`h-full absolute top-0 ${levelColor(championLevel)}`}
                  style={{ width: p(championPoints) }}
                />
                {championLevel < 2 ? null : (
                  <div
                    title={pointsUntilAndSince}
                    className={`h-full border-r absolute top-0 ${((): string => {
                      if (5 <= championLevel && championLevel <= 7) return 'border-gray-500'
                      if (championLevel === 4) return 'border-gray-400'
                      return 'border-gray-300 '
                    })()}`}
                    style={{ width: p(championPoints - championPointsSinceLastLevel) }}
                  />
                )}
              </div>
            )
          },
        ),
      )}
      <div className="grow flex items-center p-1 text-sm">
        <span title={pointsUntilAndSince}>{championPoints.toLocaleString()}</span>
      </div>
    </div>
  )
}

const levelColor = (level: number): string => {
  if (level === 7) return 'bg-gradient-to-r from-mastery7-blue to-mastery7-blue-secondary'
  if (level === 6) return 'bg-gradient-to-r from-mastery6-violet to-mastery6-violet-secondary'
  if (level === 5) return 'bg-gradient-to-r from-mastery5-red to-mastery5-red-secondary'
  if (level === 4) return 'bg-gradient-to-r from-mastery4-brown to-mastery4-brown-secondary'
  return 'bg-mastery-beige'
}

const pointsStr = (n: number): string => `${n.toLocaleString()} point${n < 2 ? '' : 's'}`

type TokensProps = {
  readonly championLevel: number
  readonly tokensEarned: number
  readonly title?: string
}

const Tokens = ({ championLevel, tokensEarned, title }: TokensProps): JSX.Element | null => {
  const render = useCallback(
    (totalTockens: number, src: string): JSX.Element => {
      const alt = `Mastery ${championLevel + 1} token`
      return (
        <span
          title={title}
          className={cssClasses(
            'flex absolute left-[13px] top-0 bg-black h-[10px] rounded-br pl-[2px]',
            ['gap-[2px] pt-[1px] pb-[2px] pr-[2px]', championLevel === 5],
            ['gap-[3px] pb-[1px] pr-[3px]', championLevel === 6],
          )}
        >
          {pipe(
            repeatElements(tokensEarned, i => (
              <img key={i} src={src} alt={alt} className="bg-cover h-full" />
            )),
            List.concat(
              repeatElements(totalTockens - tokensEarned, i => (
                <img
                  key={totalTockens - i}
                  src={src}
                  alt={`${alt} (not earned)`}
                  className="grayscale bg-cover h-full"
                />
              )),
            ),
          )}
        </span>
      )
    },
    [championLevel, title, tokensEarned],
  )

  if (championLevel === 5) return render(2, Assets.token5)
  if (championLevel === 6) return render(3, Assets.token6)
  return null
}

function repeatElements<A>(n: number, getA: (i: number) => A): List<A> {
  return pipe([...Array(Math.max(n, 0))], List.mapWithIndex(getA))
}

const ordByPercents: Ord<EnrichedChampionMasteryView> = pipe(
  number.Ord,
  ord.contramap(c => c.percents),
)

const ordByPoints: Ord<EnrichedChampionMasteryView> = pipe(
  number.Ord,
  ord.contramap(c => c.championPoints),
)

const ordByName: Ord<EnrichedChampionMasteryView> = pipe(
  string.Ord,
  ord.contramap(c => c.name),
)
