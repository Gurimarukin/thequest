import { pipe } from 'fp-ts/function'
import type { SWRResponse } from 'swr'

import { Maybe } from '../../shared/utils/fp'

type AsyncState<E, A> = Loading | Failure<E> | Success<A>

type Loading = {
  type: 'Loading'
}

type Failure<E> = {
  type: 'Failure'
  error: E
}

type Success<A> = {
  type: 'Success'
  loadedValue: A
}

const loading: Loading = { type: 'Loading' }

const failure = <E>(error: E): Failure<E> => ({ type: 'Failure', error })

const success = <A>(loadedValue: A): Success<A> => ({ type: 'Success', loadedValue })

type FromSWR<E, A> = {
  data: A | undefined
  error: E | undefined
}

const fromSWR = <E, A>({ data, error }: FromSWR<E, A>): AsyncState<E, A> => {
  if (error !== undefined) return failure(error)
  if (data === undefined) return loading
  return success(data)
}

const fold =
  <E, A, B>(onLoading: () => B, onFailure: (error: E) => B, onSuccess: (loadedValue: A) => B) =>
  (as: AsyncState<E, A>): B => {
    switch (as.type) {
      case 'Loading':
        return onLoading()
      case 'Failure':
        return onFailure(as.error)
      case 'Success':
        return onSuccess(as.loadedValue)
    }
  }

const toOption: <E, A>(as: AsyncState<E, A>) => Maybe<A> = fold(
  () => Maybe.none,
  () => Maybe.none,
  Maybe.some,
)

const toSWR = <E, A>(as: AsyncState<E, A>): Pick<SWRResponse<A, unknown>, 'data' | 'error'> =>
  pipe(
    as,
    fold<E, A, Pick<SWRResponse<A, unknown>, 'data' | 'error'>>(
      () => ({ data: undefined, error: undefined }),
      error => ({ data: undefined, error }),
      data => ({ data, error: undefined }),
    ),
  )

const AsyncState = { fromSWR, fold, toOption, toSWR }

export { AsyncState }
