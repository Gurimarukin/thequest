/* eslint-disable functional/no-expression-statements,
                  functional/no-return-void */
import { useCallback, useEffect, useRef } from 'react'

/**
 * Calls f when elt is mounted and when window is resized.
 * @returns onMount function
 */
export const useRefWithResize = <E>(f: (e: E) => void): ((e: E | null) => void) => {
  const ref = useRef<E | null>(null)

  useEffect(() => {
    const onResize = (): void => {
      if (ref.current !== null) f(ref.current)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [f])

  return useCallback(
    (e: E | null) => {
      // eslint-disable-next-line functional/immutable-data
      ref.current = e
      if (e !== null) f(e)
    },
    [f],
  )
}
