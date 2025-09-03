import { apply, io } from 'fp-ts'
import { pipe } from 'fp-ts/function'

import { DayJs } from '../../shared/models/DayJs'
import { Store } from '../../shared/models/Store'
import { DDragonVersion } from '../../shared/models/api/DDragonVersion'
import { Lang } from '../../shared/models/api/Lang'
import type { List } from '../../shared/utils/fp'
import { Future, Maybe, NonEmptyArray } from '../../shared/utils/fp'

import type { RiotApiCacheTtlConfig } from '../config/Config'
import { StoredAt } from '../models/StoredAt'
import type { CDragonRune } from '../models/riot/ddragon/CDragonRune'
import type { DDragonChampions } from '../models/riot/ddragon/DDragonChampions'
import type { DDragonRuneStyle } from '../models/riot/ddragon/DDragonRuneStyle'
import type { DDragonSummoners } from '../models/riot/ddragon/DDragonSummoners'
import { CacheUtils } from '../utils/CacheUtils'
import type { RiotApiService } from './RiotApiService'

type WithVersion<A> = {
  value: A
  version: DDragonVersion
}

type DDragonService = ReturnType<typeof DDragonService>

const DDragonService = (
  riotApiCacheTtl: RiotApiCacheTtlConfig,
  riotApiService: RiotApiService,
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
) => {
  const latestVersion = Store<Maybe<StoredAt<DDragonVersion>>>(Maybe.none)

  /**
   * Get latest version from cache if still valid, else, fetch from API and update cache
   */
  const latestVersionCached: Future<DDragonVersion> = pipe(
    apply.sequenceS(io.Apply)({
      maybeVersion: latestVersion.get,
      now: DayJs.now,
    }),
    Future.fromIO,
    Future.chain(({ maybeVersion, now }) =>
      pipe(
        maybeVersion,
        Maybe.filter(StoredAt.isStillValid(riotApiCacheTtl.ddragonLatestVersion, now)),
        Maybe.fold(
          () =>
            pipe(
              riotApiService.leagueoflegends.ddragon.api.versions,
              Future.map(NonEmptyArray.head),
              Future.chainFirstIOK(value =>
                latestVersion.set(Maybe.some({ value, storedAt: now })),
              ),
            ),
          v => Future.successful(v.value),
        ),
      ),
    ),
  )

  function champions(version: DDragonVersion, lang: Lang): Future<DDragonChampions> {
    return riotApiService.leagueoflegends.ddragon.cdn(version).data(lang).champion
  }

  const championsCached: (lang: Lang) => (version: DDragonVersion) => Future<DDragonChampions> =
    fetchCached(lang => version => champions(version, lang))

  const runesCached: (lang: Lang) => (version: DDragonVersion) => Future<List<CDragonRune>> =
    fetchCached(
      lang => () =>
        riotApiService.communitydragon.latest.plugins.rcpBeLolGameData.global(lang).v1.perks,
    )

  const summonersCached: (lang: Lang) => (version: DDragonVersion) => Future<DDragonSummoners> =
    fetchCached(
      lang => version => riotApiService.leagueoflegends.ddragon.cdn(version).data(lang).summoner,
    )

  const runeStylesCached: (
    lang: Lang,
  ) => (version: DDragonVersion) => Future<List<DDragonRuneStyle>> = fetchCached(
    lang => version => riotApiService.leagueoflegends.ddragon.cdn(version).data(lang).runesReforged,
  )

  return {
    latestVersionCached,
    latestChampions: (lang: Lang): Future<WithVersion<DDragonChampions>> =>
      pipe(
        latestVersionCached,
        Future.bindTo('version'),
        Future.bind('value', ({ version }) => championsCached(lang)(version)),
      ),
    champions,
    summonersCached,
    runeStylesCached,

    cdragon: {
      latestRunesCached: (lang: Lang): Future<List<CDragonRune>> =>
        pipe(latestVersionCached, Future.chain(runesCached(lang))),
    },
  }
}

export { DDragonService }

/**
 * Cache for langs, until version changes.
 */

const fetchCached = <A>(
  fetch: (lang: Lang) => (version: DDragonVersion) => Future<A>,
): ((lang: Lang) => (version: DDragonVersion) => Future<A>) => {
  const res = CacheUtils.fetchCached<Lang, WithVersion<A>, [version: DDragonVersion]>(
    Lang.values,
    lang_ => version_ =>
      pipe(
        fetch(lang_)(version_),
        Future.map(value => ({ value, version: version_ })),
      ),
    () => version_ => io.of(data => DDragonVersion.Eq.equals(data.version, version_)),
  )

  return lang => version =>
    pipe(
      res(lang)(version),
      Future.map(a => a.value),
    )
}
