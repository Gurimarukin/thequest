import type { Separated } from 'fp-ts/Separated'
import { identity, pipe } from 'fp-ts/function'

import { WikiStatsBalance, type WikiStatsBalanceKey } from '../../../shared/models/WikiStatsBalance'
import type { MapChangesData, MapChangesDataSkill } from '../../../shared/models/api/MapChangesData'
import { Skill } from '../../../shared/models/api/Skill'
import { Dict, List, Maybe, NonEmptyArray } from '../../../shared/utils/fp'

export type InitialMore<A> = {
  initial: List<A>
  more: List<A>
}

// ---

export type MapChange = MapChangeStat | MapChangeSkill

export type MapChangeStat = ReturnType<typeof MapChangeStat>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function MapChangeStat(name: WikiStatsBalanceKey, value: number) {
  return { type: 'stat', name, value } as const
}

export type MapChangeSkill = ReturnType<typeof MapChangeSkill>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function MapChangeSkill(skill: Skill, changes: MapChangesDataSkill) {
  return { type: 'skill', skill, changes } as const
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
      data.skills,
      Maybe.chain(skills =>
        pipe(
          Skill.values,
          List.filterMap(skill =>
            pipe(
              Dict.lookup(skill, skills),
              Maybe.map(changes => MapChangeSkill(skill, changes)),
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
