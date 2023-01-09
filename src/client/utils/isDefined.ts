export const isDefined = <A>(a: A | null | undefined): a is A => a !== null && a !== undefined
