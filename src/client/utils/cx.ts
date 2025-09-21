import type { Tuple } from '../../shared/utils/fp'
import { List } from '../../shared/utils/fp'
import { Dict } from '../../shared/utils/fp'

type SingleItemArray<A> = readonly [A] | readonly []

export function cx(
  ...c: List<string | undefined | Tuple<string | undefined, boolean> | Dict<string, boolean>>
): string | undefined {
  const classes = c.flatMap((arg): List<string> => {
    if (arg === undefined) return []

    if (typeof arg === 'string') return [arg]

    if (isArray(arg)) {
      const [className, display] = arg

      if (className === undefined || !display) return []

      return [className]
    }

    return Dict.toReadonlyArray(arg).flatMap(
      ([className, display]): SingleItemArray<string> => (display ? [className] : []),
    )
  })

  if (List.isEmpty(classes)) return undefined

  return classes.join(' ')
}

const isArray = Array.isArray as unknown as (
  c: Tuple<string | undefined, boolean> | Record<string, boolean>,
) => c is Tuple<string | undefined, boolean>
