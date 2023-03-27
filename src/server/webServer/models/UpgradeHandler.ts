import type { IncomingMessage } from 'http'
import { Status } from 'hyper-ts'
import type { Duplex } from 'stream'

import { Either, Future } from '../../../shared/utils/fp'

import { SimpleHttpResponse } from './SimpleHttpResponse'

type UpgradeHandler = (
  request: Readonly<IncomingMessage>,
  socket: Readonly<Duplex>,
  head: Buffer,
) => Future<Either<SimpleHttpResponse, void>>

const NotFound: UpgradeHandler = () =>
  Future.right(Either.left(SimpleHttpResponse.of(Status.NotFound, '')))

const UpgradeHandler = { NotFound }

export { UpgradeHandler }
