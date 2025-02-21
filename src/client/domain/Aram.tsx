import { getMapChanges } from '../components/mapChanges/getMapChanges'

export const Aram: React.FC = getMapChanges(
  'https://wiki.leagueoflegends.com/en-us/ARAM#Mode-Specific_Changes',
  c => c.aram,
)
