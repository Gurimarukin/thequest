import util from 'util'

export const unknownToError = (e: unknown): Error =>
  e instanceof Error ? e : new UnknownError(util.inspect(e, { breakLength: Infinity }))

// eslint-disable-next-line functional/no-classes
class UnknownError extends Error {}
