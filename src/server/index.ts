import { pipe } from 'fp-ts/function'

import type { NotUsed } from '../shared/utils/fp'
import { Future } from '../shared/utils/fp'

import { Application } from './Application'
import { Context } from './Context'
import { Config } from './config/Config'

const main: Future<NotUsed> = pipe(
  Config.load,
  Future.fromIOEither,
  Future.chain(Context.load),
  Future.chainIOEitherK(Application),
)

// eslint-disable-next-line functional/no-expression-statement
Future.runUnsafe(main)
