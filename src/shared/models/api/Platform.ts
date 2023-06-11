import type { Codec } from 'io-ts/Codec'
import * as C from 'io-ts/Codec'
import type { Decoder } from 'io-ts/Decoder'
import * as D from 'io-ts/Decoder'

import { StringUtils } from '../../utils/StringUtils'
import { createEnum } from '../../utils/createEnum'

type Platform = typeof e.T

const e = createEnum('BR', 'EUN', 'EUW', 'JP', 'KR', 'LA1', 'LA2', 'NA', 'OC', 'TR', 'RU')

type PlatformLower = Lowercase<Platform>
type PlatformOrLower = Platform | PlatformLower

const decoderLower: Decoder<unknown, PlatformLower> = D.literal(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...(e.values.map(StringUtils.toLowerCase) as any),
)

const orLowerCaseCodec: Codec<unknown, PlatformLower, PlatformOrLower> = C.make(
  D.union(e.decoder, decoderLower),
  { encode: StringUtils.toLowerCase },
)

const defaultPlatform: Platform = 'EUW'

const Platform = { ...e, orLowerCaseCodec, defaultPlatform }

export { Platform, PlatformLower, PlatformOrLower }
