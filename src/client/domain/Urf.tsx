import { getMapChanges } from '../components/mapChanges/getMapChanges'

export const Urf: React.FC = getMapChanges(
  'http://wiki.leagueoflegends.com/en-us/Ultra_Rapid_Fire#Mode-Specific_Changes',
  c => c.urf,
)
