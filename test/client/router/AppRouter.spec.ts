import * as D from 'io-ts/Decoder'

import { GameName } from '../../../src/shared/models/riot/GameName'
import { RiotId } from '../../../src/shared/models/riot/RiotId'
import { TagLine } from '../../../src/shared/models/riot/TagLine'
import { Either } from '../../../src/shared/utils/fp'

import { riotIdUrlCodec } from '../../../src/client/router/AppRouter'

import { expectT } from '../../expectT'

describe('riotIdUrlCodec', () => {
  it('should decode', () => {
    expectT(riotIdUrlCodec.decode('GameName-Tag')).toStrictEqual(
      Either.right(RiotId(GameName.wrap('GameName'), TagLine.wrap('Tag'))),
    )
    expectT(riotIdUrlCodec.decode('Gam-eN-ame-Tag')).toStrictEqual(
      Either.right(RiotId(GameName.wrap('Gam-eN-ame'), TagLine.wrap('Tag'))),
    )
    expectT(riotIdUrlCodec.decode('GameName#Tag')).toStrictEqual(
      D.failure('GameName#Tag', 'RiotIdUrl'),
    )
  })
})
