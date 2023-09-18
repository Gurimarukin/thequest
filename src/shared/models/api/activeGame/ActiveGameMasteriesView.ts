import * as C from 'io-ts/Codec'

import { Maybe } from '../../../utils/fp'
import { ActiveGameChampionMasteryView } from './ActiveGameChampionMasteryView'

type ActiveGameMasteriesView = C.TypeOf<typeof codec>

const codec = C.struct({
  questPercents: C.number,
  totalMasteryLevel: C.number,
  totalMasteryPoints: C.number,
  otpIndex: C.number,
  champion: Maybe.codec(ActiveGameChampionMasteryView.codec),
})

const ActiveGameMasteriesView = { codec }

export { ActiveGameMasteriesView }
