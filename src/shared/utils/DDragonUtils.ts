import { DDragonVersion } from '../models/api/DDragonVersion'

const ddragon = (path: string): string => `https://ddragon.leagueoflegends.com${path}`

const ddragonCdn = (version: DDragonVersion, path: string): string =>
  ddragon(`/cdn/${DDragonVersion.unwrap(version)}${path}`)

export const DDragonUtils = { ddragon, ddragonCdn }
