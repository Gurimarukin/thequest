import { pipe } from 'fp-ts/function'

import { DayJs } from '../../shared/models/DayJs'
import type { Platform } from '../../shared/models/api/Platform'
import type { List, Maybe } from '../../shared/utils/fp'
import { Future } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'

import { constants } from '../config/constants'
import type { LeagueEntry } from '../models/league/LeagueEntry'
import type { SummonerId } from '../models/summoner/SummonerId'
import type { LeagueEntryPersistence } from '../persistence/LeagueEntryPersistence'
import type { RiotApiService } from './RiotApiService'

type FindOptions = {
  /**
   * Keep values cached after this date.
   * @default now - constants.riotApiCacheTtl.leagueEntries
   */
  overrideInsertedAfter: DayJs
}

type LeagueEntryService = ReturnType<typeof LeagueEntryService>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const LeagueEntryService = (
  leagueEntryPersistence: LeagueEntryPersistence,
  riotApiService: RiotApiService,
) => ({
  findBySummoner: (
    platform: Platform,
    summonerId: SummonerId,
    options?: FindOptions,
  ): Future<Maybe<List<LeagueEntry>>> =>
    pipe(
      options !== undefined
        ? Future.successful(options.overrideInsertedAfter)
        : pipe(
            Future.fromIO(DayJs.now),
            Future.map(DayJs.subtract(constants.riotApiCacheTtl.leagueEntries)),
          ),
      Future.chain(insertedAfter =>
        leagueEntryPersistence.findBySummonerId(summonerId, insertedAfter),
      ),
      futureMaybe.map(e => e.entries),
      futureMaybe.alt<List<LeagueEntry>>(() =>
        pipe(
          riotApiService.riotgames.platform(platform).lol.leagueV4.entries.bySummoner(summonerId),
          futureMaybe.bindTo('entries'),
          futureMaybe.bind('insertedAt', () => futureMaybe.fromIO(DayJs.now)),
          futureMaybe.chainFirstTaskEitherK(({ entries, insertedAt }) =>
            leagueEntryPersistence.upsert({ summonerId, entries, insertedAt }),
          ),
          futureMaybe.map(({ entries }) => entries),
        ),
      ),
    ),
})

export { LeagueEntryService }