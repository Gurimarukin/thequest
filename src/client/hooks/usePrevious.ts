/* eslint-disable functional/no-expression-statements */
import { useEffect, useRef } from 'react'

import { Maybe } from '../../shared/utils/fp'

export const usePrevious = <A>(value: A): Maybe<A> => {
  const ref = useRef<Maybe<A>>(Maybe.none)

  useEffect(() => {
    // eslint-disable-next-line functional/immutable-data
    ref.current = Maybe.some(value)
  }, [value])

  return ref.current
}
