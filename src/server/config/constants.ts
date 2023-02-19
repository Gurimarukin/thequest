import { MsDuration } from '../../shared/models/MsDuration'
import type { Platform } from '../../shared/models/api/Platform'

const plateformEndpoint: Record<Platform, string> = {
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

export const constants = {
  dbRetryDelay: MsDuration.seconds(10),

  rateLimiterLifeTime: MsDuration.days(1),
  account: {
    tokenTtl: MsDuration.days(30),
    cookie: {
      name: 'userAccount',
      ttl: MsDuration.days(30),
    },
  },

  discord: {
    apiEndpoint: 'https://discord.com/api',
  },

  riotApi: {
    xRiotToken: 'X-Riot-Token',
    regionalHost: 'europe.api.riotgames.com',
    plateformEndpoint,
    cache: {
      summonerTtl: MsDuration.minutes(30),
    },
  },
}
