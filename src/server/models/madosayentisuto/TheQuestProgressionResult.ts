import * as E from 'io-ts/Encoder'

import { Either } from '../../../shared/utils/fp'

import { TheQuestProgression } from './TheQuestProgression'

type TheQuestProgressionResult = Readonly<E.TypeOf<typeof encoder>>

const encoder = E.sum('type')({
  riotAccountNotFound: E.struct({
    // type: E.id<'riotAccountNotFound'>(),
    connectionName: E.id<string>(),
  }),
  ok: E.struct({
    // type: E.id<'riotAccountNotFound'>(),
    progression: TheQuestProgression.encoder,
  }),
})

const fromEither: (e: Either<string, TheQuestProgression>) => TheQuestProgressionResult =
  Either.foldW(
    connectionName => ({ connectionName }),
    progression => ({ progression }),
  )

const TheQuestProgressionResult = { encoder, fromEither }

export { TheQuestProgressionResult }
