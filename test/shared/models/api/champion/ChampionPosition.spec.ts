import { pipe } from 'fp-ts/function'

import { ChampionPosition } from '../../../../../src/shared/models/api/champion/ChampionPosition'
import { List } from '../../../../../src/shared/utils/fp'

import { expectT } from '../../../../expectT'

describe('ChampionLevel.Ord', () => {
  it('should sort', () => {
    const levels: List<ChampionPosition> = ['jun', 'bot', 'sup', 'mid', 'bot', 'top']
    expectT(pipe(levels, List.sort(ChampionPosition.Ord))).toStrictEqual([
      'top',
      'jun',
      'mid',
      'bot',
      'bot',
      'sup',
    ])
  })
})
