import { MsDuration } from '../../shared/models/MsDuration'

export const constants = {
  accountCookieName: 'userAccount',

  lolWikiaDomain: 'https://leagueoflegends.fandom.com',

  staticDataCacheTtl: MsDuration.hours(2),
  riotApiCacheTtl: {
    ddragonLatestVersion: MsDuration.hour(1),

    activeGame: MsDuration.minutes(3),
    activeGameLoading: MsDuration.seconds(5), // if the game is loading, cache it less longer
    leagueEntries: MsDuration.minutes(3),
    masteries: MsDuration.minutes(3),
    summoner: MsDuration.minutes(9),

    account: MsDuration.days(99 * 365),
  },
}
