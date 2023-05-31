import * as D from 'io-ts/Decoder'

import { RuneStyleId } from '../../../../shared/models/api/perk/RuneStyleId'
import { RuneStyleKey } from '../../../../shared/models/api/perk/RuneStyleKey'
import { List } from '../../../../shared/utils/fp'

import { DDragonRune } from './DDragonRune'

type DDragonRuneStyle = D.TypeOf<typeof decoder>

const decoder = D.struct({
  id: RuneStyleId.codec, // 8100
  key: RuneStyleKey.codec, // 'Domination'
  icon: D.string, // 'perk-images/Styles/7200_Domination.png'
  name: D.string, // 'Domination'
  slots: List.decoder(
    D.struct({
      runes: List.decoder(DDragonRune.decoder),
    }),
  ),
})

const DDragonRuneStyle = { decoder }

export { DDragonRuneStyle }
