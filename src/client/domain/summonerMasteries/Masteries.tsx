import { number, ord, string } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import React, { useCallback, useMemo } from 'react'

import { ChampionKey } from '../../../shared/models/api/ChampionKey'
import type { ChampionMasteryView } from '../../../shared/models/api/ChampionMasteryView'
import { List, Maybe, NonEmptyArray } from '../../../shared/utils/fp'

import { useStaticData } from '../../contexts/StaticDataContext'
import { Assets } from '../../imgs/Assets'
import { cssClasses } from '../../utils/cssClasses'

type Props = {
  readonly masteries: List<ChampionMasteryView>
}

type ChampionMasteryViewWithName = ChampionMasteryView & {
  readonly name: string
}

export const Masteries = ({ masteries }: Props): JSX.Element => {
  const staticData = useStaticData()

  const championMasteries = useMemo(
    () =>
      pipe(
        staticData.champions,
        List.map(
          ({ key, name }): ChampionMasteryViewWithName =>
            pipe(
              masteries,
              List.findFirst(c => c.championId === key),
              Maybe.fold(
                (): ChampionMasteryViewWithName => ({
                  championId: key,
                  championLevel: 0,
                  championPoints: 0,
                  championPointsSinceLastLevel: 0,
                  championPointsUntilNextLevel: 0,
                  chestGranted: false,
                  tokensEarned: 0,
                  name,
                }),
                champion => ({ ...champion, name }),
              ),
            ),
        ),
      ),
    [masteries, staticData.champions],
  )

  // TODO: filter with checkboxes
  const { filteredAndSortedChampions, maybeMaxPoints } = useMemo((): {
    readonly filteredAndSortedChampions: List<ChampionMasteryViewWithName>
    readonly maybeMaxPoints: Maybe<number>
  } => {
    const filteredAndSorted = pipe(
      championMasteries,
      List.filter(c => c.championLevel <= 7),
      List.sortBy([
        ordByLevel,
        // ordByFragment, // TODO
        ordByTokens,
        ordByPoints,
        ordByName,
      ]),
    )
    return {
      filteredAndSortedChampions: filteredAndSorted,
      maybeMaxPoints: pipe(
        filteredAndSortedChampions,
        NonEmptyArray.fromReadonlyArray,
        Maybe.map(
          flow(
            NonEmptyArray.map(c => c.championPoints + c.championPointsUntilNextLevel),
            NonEmptyArray.max(number.Ord),
          ),
        ),
      ),
    } as const
  }, [championMasteries])

  return (
    <div className="grid grid-cols-[auto_1fr] gap-y-2 max-w-7xl self-center w-full">
      {filteredAndSortedChampions.map(champion => (
        <ChampionMastery
          key={ChampionKey.unwrap(champion.championId)}
          maybeMaxPoints={maybeMaxPoints}
          champion={champion}
        />
      ))}
    </div>
  )
}

type ChampionMasteryProps = {
  readonly maybeMaxPoints: Maybe<number>
  readonly champion: ChampionMasteryViewWithName
}

const ChampionMastery = ({
  maybeMaxPoints,
  champion: {
    championId,
    championLevel,
    championPoints,
    championPointsSinceLastLevel,
    championPointsUntilNextLevel,
    chestGranted,
    tokensEarned,
    name,
  },
}: ChampionMasteryProps): JSX.Element => {
  const staticData = useStaticData()

  const nameLevelTokens = `${name} - niveau ${championLevel}${
    championLevel === 5 || championLevel === 6
      ? ` - ${tokensEarned} jeton${tokensEarned < 2 ? '' : 's'}`
      : ''
  }`
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
    <>
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
          <div className="h-[14px] w-[17px] absolute left-0 bottom-0 bg-black flex flex-col-reverse rounded-tr">
            <img src={Assets.chest} alt="Chest icon" className="mb-[-2px] w-4" />
          </div>
        ) : null}
      </div>
      <div className="flex flex-col">
        {pipe(
          maybeMaxPoints,
          Maybe.fold(
            () => null,
            maxPoints => {
              const percents = (n: number): string => `${Math.round((100 * n) / maxPoints)}%`
              return (
                <div className="h-7 relative">
                  {championPointsUntilNextLevel === 0 ? null : (
                    <div
                      title={pointsUntilAndSince}
                      className="h-full bg-gray-600 opacity-50"
                      style={{ width: percents(championPoints + championPointsUntilNextLevel) }}
                    />
                  )}
                  <div
                    title={pointsUntilAndSince}
                    className={`h-full absolute top-0 ${levelColor(championLevel)}`}
                    style={{ width: percents(championPoints) }}
                  />
                  {championLevel < 2 ? null : (
                    <div
                      title={pointsUntilAndSince}
                      className={`h-full border-r absolute top-0 ${((): string => {
                        if (5 <= championLevel && championLevel <= 7) return 'border-gray-500'
                        if (championLevel === 4) return 'border-gray-400'
                        return 'border-gray-300 '
                      })()}`}
                      style={{ width: percents(championPoints - championPointsSinceLastLevel) }}
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
    </>
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

const ordByLevel: ord.Ord<ChampionMasteryViewWithName> = pipe(
  number.Ord,
  ord.reverse,
  ord.contramap(c => c.championLevel),
)

const ordByPoints: ord.Ord<ChampionMasteryViewWithName> = pipe(
  number.Ord,
  ord.reverse,
  ord.contramap(c => c.championPoints),
)

const ordByTokens: ord.Ord<ChampionMasteryViewWithName> = pipe(
  number.Ord,
  ord.reverse,
  ord.contramap(c => c.tokensEarned),
)

const ordByName: ord.Ord<ChampionMasteryViewWithName> = pipe(
  string.Ord,
  ord.contramap(c => c.name),
)
