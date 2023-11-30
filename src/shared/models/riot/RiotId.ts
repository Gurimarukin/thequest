import { eq } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import type { Codec } from 'io-ts/Codec'
import * as C from 'io-ts/Codec'
import type { Decoder } from 'io-ts/Decoder'
import * as D from 'io-ts/Decoder'
import type { Encoder } from 'io-ts/Encoder'
import * as E from 'io-ts/Encoder'

import { StringUtils } from '../../utils/StringUtils'
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

// {3-16}#{3-5}
const regex = /^(.+)#([^#]+)$/

const fromStringUnknownDecoder: Decoder<unknown, RiotId> = pipe(
  D.string,
  D.parse(str =>
    pipe(
      str,
      StringUtils.matcher2(regex),
      Maybe.fold(
        () => D.failure(str, 'RiotId'),
        ([gameName, tagLine]) =>
          D.success({ gameName: GameName.wrap(gameName), tagLine: TagLine.wrap(tagLine) }),
      ),
    ),
  ),
)

function stringify({ gameName, tagLine }: RiotId): string {
  return `${gameName}#${tagLine}`
}

const fromStringEncoder: Encoder<string, RiotId> = pipe(E.id<string>(), E.contramap(stringify))

const fromStringCodec: Codec<unknown, string, RiotId> = C.make(
  fromStringUnknownDecoder,
  fromStringEncoder,
)

const Eq: eq.Eq<RiotId> = eq.struct({
  gameName: GameName.Eq,
  tagLine: TagLine.Eq,
})

const RiotId = immutableAssign(construct, {
  fromStringCodec,
  stringify,
  Eq,
})

export { RiotId }
