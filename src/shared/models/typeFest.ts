import type { Dict } from '../utils/fp'

export type EnforceNonEmptyDict<A extends Dict<string, unknown>> = keyof A extends never ? never : A

export type Override<A, K extends keyof A, B> = Omit<A, K> & {
  [J in K]: B
}

export type RequiredPartial<A> = {
  [K in keyof Required<A>]: A[K] | undefined
}
