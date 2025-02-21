import { StaticDataChampion } from '../shared/models/api/staticData/StaticDataChampion'

import { getMapChanges } from './components/mapChanges/getMapChanges'

export const Urf: React.FC = getMapChanges(StaticDataChampion.Lens.urf)
