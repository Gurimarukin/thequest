import { pipe } from 'fp-ts/function'

import type { Tuple } from '../../shared/utils/fp'
import { List, Maybe } from '../../shared/utils/fp'

export const cx = (
  ...c: List<string | undefined | Tuple<string | undefined, boolean>>
): string | undefined =>
  pipe(
    c,
    List.filterMap((arg): Maybe<string> => {
      if (arg === undefined) return Maybe.none
      if (typeof arg === 'string') return Maybe.some(arg)

      const [className, display] = arg
      return display && className !== undefined ? Maybe.some(className) : Maybe.none
    }),
    Maybe.fromPredicate(List.isNonEmpty),
    Maybe.map(List.mkString(' ')),
    Maybe.toUndefined,
  )
