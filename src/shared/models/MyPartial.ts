export type MyPartial<A> = {
  [K in keyof Required<A>]: A[K] | undefined
}
