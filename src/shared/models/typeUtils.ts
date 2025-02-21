import type { Dict } from '../utils/fp'

export type EnforceNonEmptyDict<A extends Dict<string, unknown>> = keyof A extends never ? never : A

export type RequiredPartial<A> = {
  [K in keyof Required<A>]: A[K] | undefined
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type Expect<T extends true> =
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
  (<U>() => U extends U ? 1 : 2) extends <U>() => U extends true ? 1 : 2 ? true : false
