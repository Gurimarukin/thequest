import * as E from 'io-ts/Encoder'

import { TheQuestProgression } from './TheQuestProgression'
import { TheQuestProgressionError } from './TheQuestProgressionError'

type TheQuestProgressionResult = Readonly<E.TypeOf<typeof encoder>>

const encoder = E.sum('type')({
  summonerNotFound: E.struct({
    type: E.id<'summonerNotFound'>(),
    error: TheQuestProgressionError.encoder,
  }),
  ok: E.struct({
    type: E.id<'ok'>(),
    progression: TheQuestProgression.encoder,
  }),
})

const summonerNotFound = (error: TheQuestProgressionError): TheQuestProgressionResult => ({
  type: 'summonerNotFound',
  error,
})

const ok = (progression: TheQuestProgression): TheQuestProgressionResult => ({
  type: 'ok',
  progression,
})

const TheQuestProgressionResult = { encoder, summonerNotFound, ok }

export { TheQuestProgressionResult }
