import { MsDuration } from '../../shared/models/MsDuration'

export const constants = {
  dbRetryDelay: MsDuration.seconds(10),

  // webserver
  rateLimiterLifeTime: MsDuration.days(1),
  account: {
    tokenTtl: MsDuration.days(30),
    cookie: {
      name: 'userAccount',
      ttl: MsDuration.days(30),
    },
  },
  xRiotToken: 'X-Riot-Token',
}
