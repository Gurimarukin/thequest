import type { Separated } from 'fp-ts/Separated'
import { identity, pipe } from 'fp-ts/function'

import { WikiStatsBalance, type WikiStatsBalanceKey } from '../../../shared/models/WikiStatsBalance'
import type { ChampionSpellHtml, MapChangesData } from '../../../shared/models/api/MapChangesData'
import { SpellName } from '../../../shared/models/api/SpellName'
import { Dict, List, Maybe, NonEmptyArray } from '../../../shared/utils/fp'

export type InitialMore<A> = {
  initial: List<A>
  more: List<A>
}

// ---

export type MapChange = MapChangeStat | MapChangeSpell

export type MapChangeStat = ReturnType<typeof MapChangeStat>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function MapChangeStat(name: WikiStatsBalanceKey, value: number) {
  return { type: 'stat', name, value } as const
}

export type MapChangeSpell = ReturnType<typeof MapChangeSpell>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function MapChangeSpell(name: SpellName, html: ChampionSpellHtml) {
  return { type: 'spell', name, html } as const
}

// ---

export function mapChangesFromData(data: MapChangesData): List<MapChange> {
  const maybes: List<Maybe<NonEmptyArray<MapChange>>> = pipe([
    pipe(
      data.stats,
      Maybe.chain(stats =>
        pipe(
          WikiStatsBalance.keys,
          List.filterMap(key =>
            pipe(
              Dict.lookup(key, stats),
              Maybe.map(value => MapChangeStat(key, value)),
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
          List.filterMap(name =>
            pipe(
              Dict.lookup(name, spells),
              Maybe.map(html => MapChangeSpell(name, html)),
            ),
          ),
          NonEmptyArray.fromReadonlyArray,
        ),
      ),
    ),
  ])

  return pipe(maybes, List.compact, List.chain(identity))
}

type Sizes = Dict<'limit' | MapChange['type'], number>

export const splitWhileSmallerThan =
  ({ limit: limitSize, ...sizes }: Sizes) =>
  (data: List<MapChange>): Separated<List<MapChange>, List<MapChange>> =>
    splitWhileSmallerThanRec(sizes, limitSize, data, [])

function splitWhileSmallerThanRec(
  sizes: Dict<MapChange['type'], number>,
  limitSize: number,
  data: List<MapChange>,
  acc: List<MapChange>,
): Separated<List<MapChange>, List<MapChange>> {
  if (limitSize < 0) {
    return { left: acc, right: data }
  }

  const [head, ...tail] = data

  if (head === undefined) {
    return { left: acc, right: tail }
  }

  return splitWhileSmallerThanRec(
    sizes,
    limitSize - sizes[head.type],
    tail,
    pipe(acc, List.append(head)),
  )
}
