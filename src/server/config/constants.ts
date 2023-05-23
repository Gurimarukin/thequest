import { MsDuration } from '../../shared/models/MsDuration'

export const constants = {
  accountCookieName: 'userAccount',

  lolWikiaDomain: 'https://leagueoflegends.fandom.com',

  staticDataCacheTtl: MsDuration.hours(2),
  riotApiCacheTtl: {
    ddragonLatestVersion: MsDuration.hour(1),

    activeGame: MsDuration.minutes(2),
    leagueEntries: MsDuration.minutes(10),
    masteries: MsDuration.minutes(10),
    summoner: MsDuration.minutes(10),

    account: MsDuration.days(99 * 365),
  },
}
