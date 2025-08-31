import { readonlyArray } from 'fp-ts'

import type { List, Tuple } from '../../shared/utils/fp'
import { Dict } from '../../shared/utils/fp'

export function cx(
  ...c: List<string | undefined | Tuple<string | undefined, boolean> | Record<string, boolean>>
): string | undefined {
  const classes = c.flatMap((arg): List<string> => {
    if (arg === undefined) return []

    if (typeof arg === 'string') return [arg]

    if (isArray(arg)) {
      const [className, display] = arg

      if (className === undefined || !display) return []

      return [className]
    }

    return Dict.toReadonlyArray(arg).flatMap(([className, display]) => (display ? [className] : []))
  })

  if (readonlyArray.isEmpty(classes)) return undefined

  return classes.join(' ')
}

const isArray = Array.isArray as unknown as (
  c: Tuple<string | undefined, boolean> | Record<string, boolean>,
) => c is Tuple<string | undefined, boolean>
