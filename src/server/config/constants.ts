import { MsDuration } from '../../shared/models/MsDuration'

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

  riotApi: {
    xRiotToken: 'X-Riot-Token',
    regionalHost: 'europe.api.riotgames.com',
  },
}
