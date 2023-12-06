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

type Sep = '#' | '-'

// {3-16}#{3-5}
function regex(sep: Sep): RegExp {
  return RegExp(`^(.+)${sep}([^${sep}]+)$`)
}

function getFromStringDecoder(sep: Sep): Decoder<string, RiotId> {
  return {
    decode: str =>
      pipe(
        str,
        StringUtils.matcher2(regex(sep)),
        Maybe.fold(
          () => D.failure(str, `RiotId[${sep}]`),
          ([gameName, tagLine]) => D.success(construct(GameName(gameName), TagLine(tagLine))),
        ),
      ),
  }
}

function getFromStringUnknownDecoder(sep: Sep): Decoder<unknown, RiotId> {
  return pipe(D.string, D.compose(getFromStringDecoder(sep)))
}

const getStringify =
  (sep: Sep) =>
  ({ gameName, tagLine }: RiotId): string =>
    `${gameName}${sep}${tagLine}`

function getFromStringEncoder(sep: Sep): Encoder<string, RiotId> {
  return pipe(E.id<string>(), E.contramap(getStringify(sep)))
}

function getFromStringCodec(sep: Sep): Codec<unknown, string, RiotId> {
  return C.make(getFromStringUnknownDecoder(sep), getFromStringEncoder(sep))
}

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
  getFromStringCodec,
  fromStringDecoder: getFromStringDecoder('#'),
  fromStringCodec: getFromStringCodec('#'),
  stringify: getStringify('#'),
  trim,
  clean,
  Eq,
})

export { RiotId }
