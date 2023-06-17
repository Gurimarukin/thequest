import * as C from 'io-ts/Codec'
import * as D from 'io-ts/Decoder'
import * as E from 'io-ts/Encoder'

import { Either, Tuple } from '../../../src/shared/utils/fp'
import { MapFromArray } from '../../../src/shared/utils/ioTsUtils'

import { ChampionEnglishName } from '../../../src/server/models/wikia/ChampionEnglishName'

import { expectT } from '../../expectT'

describe('MapFromArray', () => {
  const codec = MapFromArray.codec(ChampionEnglishName.Ord)(
    ChampionEnglishName.codec,
    C.tuple(C.string, C.number),
  )

  const decoder = MapFromArray.decoder(ChampionEnglishName.Ord)(
    ChampionEnglishName.codec,
    D.tuple(D.string, D.number),
  )

  const encoder = MapFromArray.encoder(ChampionEnglishName.Ord)(
    ChampionEnglishName.codec,
    E.tuple(E.id<string>(), E.id<number>()),
  )

  const map: E.TypeOf<typeof encoder> = new Map([
    [ChampionEnglishName.wrap('abc'), ['foo', 1]],
    [ChampionEnglishName.wrap('def'), ['bar', 2]],
    [ChampionEnglishName.wrap('abc'), ['baz', 3]],
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
          [ChampionEnglishName.wrap('abc'), Tuple.of('baz', 3)],
          [ChampionEnglishName.wrap('def'), Tuple.of('bar', 2)],
        ]),
      ),
    )
  })

  it('should decode encoded', () => {
    const encoded = codec.encode(map)
    expectT(codec.decode(encoded)).toStrictEqual(Either.right(map))
  })
})
