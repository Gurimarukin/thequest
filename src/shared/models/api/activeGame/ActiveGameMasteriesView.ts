import * as C from 'io-ts/Codec'

import { Maybe } from '../../../utils/fp'
import { ActiveGameChampionMasteryView } from './ActiveGameChampionMasteryView'

type ActiveGameMasteriesView = C.TypeOf<typeof codec>

const codec = C.struct({
  totalPercents: C.number,
  totalScore: C.number,
  champion: Maybe.codec(ActiveGameChampionMasteryView.codec),
})

const ActiveGameMasteriesView = { codec }

export { ActiveGameMasteriesView }
