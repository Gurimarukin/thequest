import * as D from 'io-ts/Decoder'

import { GameName } from '../../../src/shared/models/riot/GameName'
import { RiotId } from '../../../src/shared/models/riot/RiotId'
import { TagLine } from '../../../src/shared/models/riot/TagLine'
import { Either } from '../../../src/shared/utils/fp'

import { riotIdCodec } from '../../../src/client/router/AppRouter'

import { expectT } from '../../expectT'

describe('riotIdUrlCodec', () => {
  it('should decode', () => {
    expectT(riotIdCodec.decode('GameName-Tag')).toStrictEqual(
      Either.right(RiotId(GameName('GameName'), TagLine('Tag'))),
    )
    expectT(riotIdCodec.decode('Gam-eN-ame-Tag')).toStrictEqual(
      Either.right(RiotId(GameName('Gam-eN-ame'), TagLine('Tag'))),
    )
    expectT(riotIdCodec.decode('GameName#Tag')).toStrictEqual(
      D.failure('GameName#Tag', 'RiotId[-]'),
    )
  })
})
