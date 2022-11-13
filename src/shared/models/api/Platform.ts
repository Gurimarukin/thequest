import { createEnum } from '../../utils/createEnum'

type Platform = typeof e.T

const e = createEnum('BR1', 'EUN1', 'EUW1', 'JP1', 'KR', 'LA1', 'LA2', 'NA1', 'OC1', 'TR1', 'RU')

const endpoint: Record<Platform, string> = {
  BR1: 'br1.api.riotgames.com',
  EUN1: 'eun1.api.riotgames.com',
  EUW1: 'euw1.api.riotgames.com',
  JP1: 'jp1.api.riotgames.com',
  KR: 'kr.api.riotgames.com',
  LA1: 'la1.api.riotgames.com',
  LA2: 'la2.api.riotgames.com',
  NA1: 'na1.api.riotgames.com',
  OC1: 'oc1.api.riotgames.com',
  TR1: 'tr1.api.riotgames.com',
  RU: 'ru.api.riotgames.com',
}

const Platform = {
  codec: e.codec,
  decoder: e.decoder,
  encoder: e.encoder,
  values: e.values,
  endpoint,
}

export { Platform }
