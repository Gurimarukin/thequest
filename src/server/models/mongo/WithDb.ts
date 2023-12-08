import { pipe } from 'fp-ts/function'
import type { Db } from 'mongodb'
import { MongoClient } from 'mongodb'
import type { Readable } from 'stream'

import type { MsDuration } from '../../../shared/models/MsDuration'
import type { LoggerType } from '../../../shared/models/logger/LoggerType'
import { TObservable } from '../../../shared/models/rx/TObservable'
import { StringUtils } from '../../../shared/utils/StringUtils'
import { Future, Try } from '../../../shared/utils/fp'

import type { DbConfig } from '../../config/Config'
import { TObservableUtils } from '../../utils/TObservableUtils'

const { prettyMs } = StringUtils

export type WithDb = ReturnType<typeof of>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function of(client: MongoClient, dbName: string) {
  return {
    client,

    future: <A>(f: (db: Db) => Promise<A>): Future<A> =>
      Future.tryCatch(() => f(client.db(dbName))),

    observable: (f: (db: Db) => Readable): TObservable<unknown> => {
      const obs = pipe(
        Try.tryCatch(() => f(client.db(dbName))),
        Try.map(TObservableUtils.observableFromReadable),
        Try.getOrElseW(TObservable.throwError),
      )
      return TObservable.fromSubscribe(subscriber =>
        obs.subscribe({
          next: u => subscriber.next(u),
          error: e => subscriber.error(e),
          complete: () => subscriber.complete(),
        }),
      )
    },
  }
}

function load(config: DbConfig, logger: LoggerType, retryDelay: MsDuration): Future<WithDb> {
  const futureClient: Future<MongoClient> = pipe(
    Future.tryCatch(() =>
      new MongoClient(`mongodb://${config.user}:${config.password}@${config.host}`).connect(),
    ),
    Future.orElse(() =>
      pipe(
        logger.info(
          `Mongo client couldn't connect, waiting ${prettyMs(retryDelay)} before next try`,
        ),
        Future.fromIOEither,
        Future.chain(() => pipe(futureClient, Future.delay(retryDelay))),
      ),
    ),
  )

  return pipe(
    futureClient,
    Future.map(client => of(client, config.dbName)),
  )
}

export const WithDb = { load }
