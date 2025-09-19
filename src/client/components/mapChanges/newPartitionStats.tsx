import { monoid, number, separated } from 'fp-ts'
import type { Separated } from 'fp-ts/Separated'
import { identity, pipe } from 'fp-ts/function'

import type { WikiStatsBalanceKey } from '../../../shared/models/WikiStatsBalance'
import { WikiStatsBalance } from '../../../shared/models/WikiStatsBalance'
import type { ChampionSpellHtml, MapChangesData } from '../../../shared/models/api/MapChangesData'
import { SpellName } from '../../../shared/models/api/SpellName'
import { Dict, Either, List, Maybe, NonEmptyArray } from '../../../shared/utils/fp'

import { useTranslation } from '../../contexts/TranslationContext'
import { Assets } from '../../imgs/Assets'
import { cx } from '../../utils/cx'

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
    <li className="grid grid-cols-[auto_1fr] items-center justify-items-start gap-1">
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
    </li>
  )
}

type SpellProps = {
  spell: SpellName
  html: string
}

const Spell: React.FC<SpellProps> = ({ spell, html }) => {
  const { t } = useTranslation('common')

  return (
    <li className="flex items-center gap-1">
      <span dangerouslySetInnerHTML={{ __html: html }} className="wiki compact" />
      <span>{t.labels.spell[spell]}</span>
    </li>
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

type InitialMore<A> = {
  initial: List<A>
  more: List<A>
}

/**
 * Puts elements in `initial` until `wrapAfterSize` is reached.
 * Then puts remaining even elements in `more`, and appends odd elements to `initial`.
 *
 * @param wrapAfterSize should be `imageSize - 2 x paddingYSize`
 */
export function partitionStatsWrap(
  wrapAfterSize: number,
  data: MapChangesData,
): InitialMore<React.ReactElement> {
  const { left: initial, right: more } = pipe(
    separateData(data),
    splitWhileSmallerThan(wrapAfterSize),
    evenOddRights,
    separated.bimap(toElements, toElements),
  )

  return { initial, more }
}

function separateData(data: MapChangesData): List<Either<Stat, Spell>> {
  const maybes: List<Maybe<NonEmptyArray<Either<Stat, Spell>>>> = pipe([
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

  return pipe(maybes, List.compact, List.chain(identity))
}

// Must be aligned with CSS
const sizes = {
  stat: 3,
  spell: 5,
}

/**
 * @param limitSize should be `imageSize - 2 x paddingYSize`
 */
const splitWhileSmallerThan =
  (limitSize: number) =>
  (
    data: List<Either<Stat, Spell>>,
    accLeft: List<Either<Stat, Spell>> = [],
    accHeight = 0,
  ): Separated<List<Either<Stat, Spell>>, List<Either<Stat, Spell>>> => {
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

    if (newAccHeight > limitSize) {
      return { left: newAccLeft, right: tail }
    }

    return splitWhileSmallerThan(limitSize)(tail, newAccLeft, newAccHeight)
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

const toElements = List.map(
  Either.fold<Stat, Spell, React.ReactElement>(
    ({ key, value }) => <Stat key={key} name={key} value={value} />,
    ({ key, value }) => <Spell key={key} spell={key} html={value.spell} />,
  ),
)

/**
 * @param limitSize should be `imageSize - 2 x paddingYSize`
 * @returns One column, if smaller than `limitSize`, else splits elements in two even columns.
 */
export function partitionStats2Cols(
  limitSize: number,
  data: MapChangesData,
): InitialMore<React.ReactElement> {
  const eithers = separateData(data)

  const sizes_ = pipe(
    eithers,
    List.map(
      Either.fold(
        () => sizes.stat,
        () => sizes.spell,
      ),
    ),
  )

  const totalSize = pipe(sizes_, monoid.concatAll(number.MonoidSum))

  if (totalSize <= limitSize) {
    return { initial: toElements(eithers), more: [] }
  }

  const { left: initial, right: more } = pipe(
    splitWhileSmallerThan(totalSize / 2)(eithers),
    separated.bimap(toElements, toElements),
  )

  return { initial, more }
}
