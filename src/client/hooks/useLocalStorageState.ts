import { json } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import type { Codec } from 'io-ts/Codec'
import { useEffect, useState } from 'react'

import type { Tuple } from '../../shared/utils/fp'
import { Either } from '../../shared/utils/fp'
import { decodeError } from '../../shared/utils/ioTsUtils'

/**
 * @param initialState if not found in localStorage
 */
export const useLocalStorageState = <O, A>(
  key: string,
  [codec, codecName]: Tuple<Codec<unknown, O, A>, string>,
  initialState: A,
): Tuple<A, React.Dispatch<React.SetStateAction<A>>> => {
  const [a, setA] = useState<A>(() => {
    const item = localStorage.getItem(key)
    if (item === null) return initialState
    return pipe(
      json.parse(item),
      Either.mapLeft(Either.toError),
      Either.chain(u => pipe(codec.decode(u), Either.mapLeft(decodeError(codecName)(u)))),
      Either.getOrElse(e => {
        console.warn('useLocalStorageState: error while reading from localStorage', e)
        return initialState
      }),
    )
  })

  useEffect(
    () =>
      pipe(
        codec.encode(a),
        json.stringify,
        Either.mapLeft(Either.toError),
        Either.fold(
          e => console.warn('useLocalStorageState: error while writing to localStorage', e),
          str => localStorage.setItem(key, str),
        ),
      ),
    [a, codec, key],
  )

  return [a, setA]
}
