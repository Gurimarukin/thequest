import { MsDuration } from '../../shared/models/MsDuration'

export const constants = {
  accountCookieName: 'userAccount',

  lolWikiaDomain: 'https://leagueoflegends.fandom.com',

  staticDataCacheTtl: MsDuration.hours(2),
  riotApiCacheTtl: {
    ddragonLatestVersion: MsDuration.hour(1),
    summoner: MsDuration.minutes(15),
    masteries: MsDuration.minutes(5),
    account: MsDuration.days(99 * 365),
  },
}
