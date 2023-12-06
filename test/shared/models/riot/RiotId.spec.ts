import * as D from 'io-ts/Decoder'

import { GameName } from '../../../../src/shared/models/riot/GameName'
import { RiotId } from '../../../../src/shared/models/riot/RiotId'
import { TagLine } from '../../../../src/shared/models/riot/TagLine'
import { Either } from '../../../../src/shared/utils/fp'

import { expectT } from '../../../expectT'

describe('RiotId.fromStringDecoder', () => {
  it('should decode', () => {
    expectT(RiotId.fromStringDecoder.decode('GameName#Tag')).toStrictEqual(
      Either.right(RiotId(GameName('GameName'), TagLine('Tag'))),
    )
    expectT(RiotId.fromStringDecoder.decode('Gam#eN#ame#Tag')).toStrictEqual(
      Either.right(RiotId(GameName('Gam#eN#ame'), TagLine('Tag'))),
    )
    expectT(RiotId.fromStringDecoder.decode('GameName-Tag')).toStrictEqual(
      D.failure('GameName-Tag', 'RiotId[#]'),
    )
  })
})
