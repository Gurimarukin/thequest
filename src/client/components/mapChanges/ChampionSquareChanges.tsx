import { separated } from 'fp-ts'
import type { Separated } from 'fp-ts/Separated'
import { identity, pipe } from 'fp-ts/function'
import { useMemo, useRef } from 'react'

import type { WikiStatsBalanceKey } from '../../../shared/models/WikiStatsBalance'
import { WikiStatsBalance } from '../../../shared/models/WikiStatsBalance'
import type { ChampionSpellHtml, MapChangesData } from '../../../shared/models/api/MapChangesData'
import { SpellName } from '../../../shared/models/api/SpellName'
import type { StaticDataChampion } from '../../../shared/models/api/staticData/StaticDataChampion'
import { Dict, Either, List, Maybe, NonEmptyArray } from '../../../shared/utils/fp'

import { useTranslation } from '../../contexts/TranslationContext'
import { Assets } from '../../imgs/Assets'
import type { MapChangesChampionCategory } from '../../models/MapChangesChampionCategory'
import { cx } from '../../utils/cx'
import { Tooltip } from '../tooltip/Tooltip'
import { MapChangesTooltip } from './MapChangesTooltip'

type Props = {
  tooltiPlacementRef: React.RefObject<Element>
  imageSize: number
  data: MapChangesData
}

export type EnrichedStaticDataChampion = StaticDataChampion & {
  isHidden: boolean
  category: MapChangesChampionCategory
}

export const championSquareChangesClassName =
  'grid grid-cols-[auto_1fr] grid-rows-[auto_1fr] overflow-hidden rounded-lg bg-aram-stats text-2xs'

export const ChampionSquareChanges: React.FC<Props> = ({ tooltiPlacementRef, imageSize, data }) => {
  const initialRef = useRef<HTMLDivElement>(null)
  const moreRef = useRef<HTMLDivElement>(null)

  const { left: initial, right: more } = useMemo(
    () => splitStatsAndSpells(imageSize, data),
    [data, imageSize],
  )

  return (
    <>
      <div ref={initialRef} className="row-span-2 grid place-items-center">
        {List.isNonEmpty(initial) && <ul className="p-0.5">{initial}</ul>}
      </div>

      <div ref={moreRef} className="grid items-end justify-items-center">
        {List.isNonEmpty(more) && <ul className="p-0.5">{more}</ul>}
      </div>

      <Tooltip hoverRef={[initialRef, moreRef]} placementRef={tooltiPlacementRef}>
        <MapChangesTooltip data={data} />
      </Tooltip>
    </>
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
  imageSize: number,
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
    splitWhileSmallerThanImage(imageSize),
    evenOddRights,
    separated.bimap(toElement, toElement),
  )
}

// Must be aligned with CSS
const sizes = {
  paddingY: 0.5,
  stat: 3,
  spell: 5,
}

const splitWhileSmallerThanImage =
  (imageSize: number) =>
  (
    data: List<Either<Stat, Spell>>,
    accLeft: List<Either<Stat, Spell>> = [],
    accHeight: number = sizes.paddingY * 2,
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

    if (newAccHeight > imageSize) {
      return { left: newAccLeft, right: tail }
    }

    return splitWhileSmallerThanImage(imageSize)(tail, newAccLeft, newAccHeight)
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
