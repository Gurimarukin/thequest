import { apply, io } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'

import { DayJs } from '../../shared/models/DayJs'
import { Store } from '../../shared/models/Store'
import { DDragonVersion } from '../../shared/models/api/DDragonVersion'
import { Lang } from '../../shared/models/api/Lang'
import type { List } from '../../shared/utils/fp'
import { Future, Maybe, NonEmptyArray, PartialDict, Tuple } from '../../shared/utils/fp'

import { constants } from '../config/constants'
import { StoredAt } from '../models/StoredAt'
import type { CDragonRune } from '../models/riot/ddragon/CDragonRune'
import type { DDragonChampions } from '../models/riot/ddragon/DDragonChampions'
import type { DDragonRuneStyle } from '../models/riot/ddragon/DDragonRuneStyle'
import type { DDragonSummoners } from '../models/riot/ddragon/DDragonSummoners'
import type { RiotApiService } from './RiotApiService'

type WithVersion<A> = {
  value: A
  version: DDragonVersion
}

type DDragonService = ReturnType<typeof DDragonService>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const DDragonService = (riotApiService: RiotApiService) => {
  const latestVersion = Store<Maybe<StoredAt<DDragonVersion>>>(Maybe.none)

  /**
   * Get latest version from cache if still valid, else, fetch from API and update cache
   */
  const getLatestVersionWithCache: Future<DDragonVersion> = pipe(
    apply.sequenceS(io.Apply)({
      maybeVersion: latestVersion.get,
      now: DayJs.now,
    }),
    Future.fromIO,
    Future.chain(({ maybeVersion, now }) =>
      pipe(
        maybeVersion,
        Maybe.filter(StoredAt.isStillValid(constants.riotApiCacheTtl.ddragonLatestVersion, now)),
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

  const champions: (lang: Lang) => (version: DDragonVersion) => Future<DDragonChampions> =
    fetchCached(
      lang => version => riotApiService.leagueoflegends.ddragon.cdn(version).data(lang).champion,
      [Lang.defaultLang, Lang.english],
    )

  const runes: (lang: Lang) => (version: DDragonVersion) => Future<List<CDragonRune>> = fetchCached(
    lang => () =>
      riotApiService.communitydragon.latest.plugins.rcpBeLolGameData.global(lang).v1.perks,
  )

  const summoners: (lang: Lang) => (version: DDragonVersion) => Future<DDragonSummoners> =
    fetchCached(
      lang => version => riotApiService.leagueoflegends.ddragon.cdn(version).data(lang).summoner,
    )

  const runeStyles: (lang: Lang) => (version: DDragonVersion) => Future<List<DDragonRuneStyle>> =
    fetchCached(
      lang => version =>
        riotApiService.leagueoflegends.ddragon.cdn(version).data(lang).runesReforged,
    )

  return {
    latestVersion: getLatestVersionWithCache,
    latestChampions: (lang: Lang): Future<WithVersion<DDragonChampions>> =>
      pipe(
        getLatestVersionWithCache,
        Future.bindTo('version'),
        Future.bind('value', ({ version }) => champions(lang)(version)),
      ),
    champions,
    summoners,
    runeStyles,

    cdragon: {
      latestRunes: (lang: Lang): Future<List<CDragonRune>> =>
        pipe(getLatestVersionWithCache, Future.chain(runes(lang))),
    },
  }
}

export { DDragonService }

/**
 * Cache only for some langs, until version changes.
 */

const fetchCached = <A>(
  fetch: (lang: Lang) => (version: DDragonVersion) => Future<A>,
  cacheForLangs: NonEmptyArray<Lang> = [Lang.defaultLang],
): ((lang: Lang) => (version: DDragonVersion) => Future<A>) => {
  const caches = pipe(
    cacheForLangs,
    NonEmptyArray.map(lang => Tuple.of(lang, Store<Maybe<WithVersion<A>>>(Maybe.none))),
    PartialDict.fromEntries,
  )

  return lang => {
    const cache = caches[lang]

    if (cache === undefined) return fetch(lang)

    return version =>
      pipe(
        Future.fromIO(cache.get),
        Future.chain(
          flow(
            Maybe.filter(v => DDragonVersion.Eq.equals(v.version, version)),
            Maybe.fold(
              () =>
                pipe(
                  fetch(lang)(version),
                  Future.chainFirstIOK(value => cache.set(Maybe.some({ value, version }))),
                ),
              v => Future.successful(v.value),
            ),
          ),
        ),
      )
  }
}
