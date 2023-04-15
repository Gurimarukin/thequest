import { MsDuration } from '../../shared/models/MsDuration'
import type { Platform } from '../../shared/models/api/Platform'
import type { Dict } from '../../shared/utils/fp'

const plateformEndpoint: Dict<Platform, string> = {
  BR: 'br1.api.riotgames.com',
  EUN: 'eun1.api.riotgames.com',
  EUW: 'euw1.api.riotgames.com',
  JP: 'jp1.api.riotgames.com',
  KR: 'kr.api.riotgames.com',
  LA1: 'la1.api.riotgames.com',
  LA2: 'la2.api.riotgames.com',
  NA: 'na1.api.riotgames.com',
  OC: 'oc1.api.riotgames.com',
  TR: 'tr1.api.riotgames.com',
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

  staticDataCacheTtl: MsDuration.hours(2),
  riotApi: {
    regionalHost: 'europe.api.riotgames.com',
    plateformEndpoint,
    cacheTtl: {
      ddragonLatestVersion: MsDuration.hour(1),
      summoner: MsDuration.minutes(15),
      masteries: MsDuration.minutes(5),
      account: MsDuration.days(99 * 365),
    },
  },
}
