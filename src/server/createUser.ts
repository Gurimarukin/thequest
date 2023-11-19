import { pipe } from 'fp-ts/function'
import { exit } from 'process'

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
      userService.createUserInteractive,
      Future.orElseIOEitherK(e => logger.error(e)),
      Future.chainIOEitherK(() => logger.info('Done')),
    )
  }),
  Future.map(() => exit(0)),
)

// eslint-disable-next-line functional/no-expression-statements
Future.runUnsafe(main)
