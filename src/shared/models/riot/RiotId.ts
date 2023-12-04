import { eq } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import type { Codec } from 'io-ts/Codec'
import * as C from 'io-ts/Codec'
import type { Decoder } from 'io-ts/Decoder'
import * as D from 'io-ts/Decoder'
import type { Encoder } from 'io-ts/Encoder'
import * as E from 'io-ts/Encoder'

import { StringUtils } from '../../utils/StringUtils'
import type { Tuple } from '../../utils/fp'
import { Maybe, immutableAssign } from '../../utils/fp'
import { GameName } from './GameName'
import { TagLine } from './TagLine'

type RiotId = {
  gameName: GameName
  tagLine: TagLine
}

function construct(gameName: GameName, tagLine: TagLine): RiotId {
  return { gameName, tagLine }
}

function fromRawTuple([gameName, tagLine]: Tuple<string, string>): RiotId {
  return { gameName: GameName(gameName), tagLine: TagLine(tagLine) }
}

// {3-16}#{3-5}
const regex = /^(.+)#([^#]+)$/

const fromStringDecoder: Decoder<string, RiotId> = {
  decode: str =>
    pipe(
      str,
      StringUtils.matcher2(regex),
      Maybe.fold(() => D.failure(str, 'RiotId'), flow(fromRawTuple, D.success)),
    ),
}

const fromStringUnknownDecoder: Decoder<unknown, RiotId> = pipe(
  D.string,
  D.compose(fromStringDecoder),
)

function stringify({ gameName, tagLine }: RiotId): string {
  return `${gameName}#${tagLine}`
}

const fromStringEncoder: Encoder<string, RiotId> = pipe(E.id<string>(), E.contramap(stringify))

const fromStringCodec: Codec<unknown, string, RiotId> = C.make(
  fromStringUnknownDecoder,
  fromStringEncoder,
)

function trim({ gameName, tagLine }: RiotId): RiotId {
  return { gameName: GameName.trim(gameName), tagLine: TagLine.trim(tagLine) }
}

function clean({ gameName, tagLine }: RiotId): RiotId {
  return { gameName: GameName.clean(gameName), tagLine: TagLine.clean(tagLine) }
}

const Eq: eq.Eq<RiotId> = eq.struct({
  gameName: GameName.Eq,
  tagLine: TagLine.Eq,
})

const RiotId = immutableAssign(construct, {
  fromRawTuple,
  fromStringDecoder,
  fromStringCodec,
  stringify,
  trim,
  clean,
  Eq,
})

export { RiotId }
