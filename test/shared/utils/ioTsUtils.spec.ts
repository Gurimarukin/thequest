import * as C from 'io-ts/Codec'
import * as D from 'io-ts/Decoder'
import * as E from 'io-ts/Encoder'

import { DiscordUserId } from '../../../src/shared/models/discord/DiscordUserId'
import { Either, Tuple } from '../../../src/shared/utils/fp'
import { MapFromArray } from '../../../src/shared/utils/ioTsUtils'

import { expectT } from '../../expectT'

describe('MapFromArray', () => {
  const codec = MapFromArray.codec(DiscordUserId.Ord)(
    DiscordUserId.codec,
    C.tuple(C.string, C.number),
  )

  const decoder = MapFromArray.decoder(DiscordUserId.Eq)(
    DiscordUserId.codec,
    D.tuple(D.string, D.number),
  )

  const encoder = MapFromArray.encoder(DiscordUserId.Ord)(
    DiscordUserId.codec,
    E.tuple(E.id<string>(), E.id<number>()),
  )

  const map: E.TypeOf<typeof encoder> = new Map([
    [DiscordUserId('abc'), ['foo', 1]],
    [DiscordUserId('def'), ['bar', 2]],
    [DiscordUserId('abc'), ['baz', 3]],
  ])

  it('should encode', () => {
    expectT(encoder.encode(map)).toStrictEqual([
      ['abc', ['baz', 3]],
      ['def', ['bar', 2]],
    ])
  })

  it('should decode', () => {
    expectT(
      decoder.decode([
        ['def', ['bar', 2]],
        ['abc', ['foo', 1]],
        ['abc', ['baz', 3]],
      ]),
    ).toStrictEqual(
      Either.right(
        new Map([
          [DiscordUserId('abc'), Tuple.of('baz', 3)],
          [DiscordUserId('def'), Tuple.of('bar', 2)],
        ]),
      ),
    )
  })

  it('should decode encoded', () => {
    const encoded = codec.encode(map)
    expectT(codec.decode(encoded)).toStrictEqual(Either.right(map))
  })
})
