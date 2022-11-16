import { pipe } from 'fp-ts/function'

import type { NotUsed } from '../shared/utils/fp'
import { Future } from '../shared/utils/fp'

import { Context } from './Context'
import { Config } from './config/Config'

const main: Future<NotUsed> = pipe(
  Config.load,
  Future.fromIOEither,
  Future.map(Config.Lens.logLevel.set('debug')),
  Future.chain(Context.load),
  Future.chain(({ Logger, userService }) => {
    const logger = Logger('Application')
    return pipe(
      userService.createUser,
      Future.orElseIOEitherK(e => logger.error(e)),
      Future.chainIOEitherK(() => logger.info('Done')),
    )
  }),
)

// eslint-disable-next-line functional/no-expression-statement
Future.runUnsafe(main)
