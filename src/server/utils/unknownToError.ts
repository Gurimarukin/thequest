import util from 'util'

export const unknownToError = (e: unknown): Error =>
  e instanceof Error ? e : new UnknownError(util.formatWithOptions({ breakLength: Infinity }, e))

// eslint-disable-next-line functional/no-classes
class UnknownError extends Error {}
