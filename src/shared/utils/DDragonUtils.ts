import type { DDragonVersion } from '../models/api/DDragonVersion'

const ddragon = (path: string): string => `https://ddragon.leagueoflegends.com${path}`

const ddragonCdn = (version: DDragonVersion, path: string): string =>
  ddragon(`/cdn/${version}${path}`)

export const DDragonUtils = { ddragon, ddragonCdn }
