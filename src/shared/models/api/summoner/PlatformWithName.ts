import { pipe } from 'fp-ts/function'
import * as C from 'io-ts/Codec'
import type { Decoder } from 'io-ts/Decoder'
import * as D from 'io-ts/Decoder'

import { StringUtils } from '../../../utils/StringUtils'
import { Maybe } from '../../../utils/fp'
import { Platform } from '../Platform'

type PlatformWithName = Readonly<C.TypeOf<typeof codec>>

const codec = C.struct({
  platform: Platform.codec,
  name: C.string,
})

const fromStringRegex = /^(.+)#([^#]+)$/

// DiscordConnection.name decoder
// JeanMarieLeePong#EUW
const fromStringDecoder: Decoder<string, PlatformWithName> = pipe(
  D.id<string>(),
  D.parse(str =>
    pipe(
      str,
      StringUtils.matcher2(fromStringRegex),
      Maybe.fold(
        () => D.failure(str, 'TupleFromStringWithHashtag'),
        ([name, platform]) => D.success({ platform, name }),
      ),
    ),
  ),
  D.compose(codec),
)

const PlatformWithName = { codec, fromStringDecoder }

export { PlatformWithName }
