import { StaticDataChampion } from '../../shared/models/api/staticData/StaticDataChampion'

import { getMapChanges } from '../components/mapChanges/getMapChanges'

export const Aram: React.FC = getMapChanges(StaticDataChampion.Lens.aram)
