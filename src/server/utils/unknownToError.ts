import { utilInspect } from './utilInspect'

export const unknownToError = (e: unknown): Error =>
  e instanceof Error ? e : new UnknownError(utilInspect(e, { breakLength: Infinity }))

// eslint-disable-next-line functional/no-classes, functional/no-class-inheritance
class UnknownError extends Error {
  constructor(message?: string) {
    /* eslint-disable functional/no-expression-statements */
    super(message)

    // eslint-disable-next-line functional/no-this-expressions
    this.name = 'UnknownError'
    /* eslint-enable functional/no-expression-statements */
  }
}
