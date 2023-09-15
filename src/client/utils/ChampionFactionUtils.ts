import { ord, string } from 'fp-ts'
import type { Ord } from 'fp-ts/Ord'
import { pipe } from 'fp-ts/function'

import type { ChampionFaction } from '../../shared/models/api/champion/ChampionFaction'
import { StringUtils } from '../../shared/utils/StringUtils'

import type { Translation } from '../models/Translation'

const { cleanUTF8ToASCII } = StringUtils

export const ChampionFactionUtils = {
  Ord: {
    byLabel: (t: Translation['common']): Ord<ChampionFaction> =>
      pipe(
        string.Ord,
        ord.contramap(f => cleanUTF8ToASCII(t.labels.faction[f])),
      ),
  },
}
