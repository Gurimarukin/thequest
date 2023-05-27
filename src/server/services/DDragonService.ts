import { apply, io } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'

import { DayJs } from '../../shared/models/DayJs'
import { Store } from '../../shared/models/Store'
import { DDragonVersion } from '../../shared/models/api/DDragonVersion'
import { Lang } from '../../shared/models/api/Lang'
import type { List } from '../../shared/utils/fp'
import { Future, Maybe, NonEmptyArray } from '../../shared/utils/fp'

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

export type VersionWithChampions = WithVersion<DDragonChampions>

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

  const latestChampionsDefaultLang = Store<Maybe<WithVersion<DDragonChampions>>>(Maybe.none)
  const latestSummonersDefaultLang = Store<Maybe<WithVersion<DDragonSummoners>>>(Maybe.none)
  const latestRuneStylesDefaultLang = Store<Maybe<WithVersion<List<DDragonRuneStyle>>>>(Maybe.none)
  const latestRunesDefaultLang = Store<Maybe<WithVersion<List<CDragonRune>>>>(Maybe.none)

  const champions = getLatest(
    latestChampionsDefaultLang,
    (version, lang) => riotApiService.leagueoflegends.ddragon.cdn(version).data(lang).champion,
  )

  const runes = getLatest(
    latestRunesDefaultLang,
    ({}, lang: Lang) =>
      riotApiService.communitydragon.latest.plugins.rcpBeLolGameData.global(lang).v1.perks,
  )

  const summoners: (lang: Lang) => (version: DDragonVersion) => Future<DDragonSummoners> =
    getLatest(
      latestSummonersDefaultLang,
      (version, lang) => riotApiService.leagueoflegends.ddragon.cdn(version).data(lang).summoner,
    )

  const runeStyles: (lang: Lang) => (version: DDragonVersion) => Future<List<DDragonRuneStyle>> =
    getLatest(
      latestRuneStylesDefaultLang,
      (version, lang) =>
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
    summoners,
    runeStyles,

    cdragon: {
      latestRunes: (lang: Lang): Future<List<CDragonRune>> =>
        pipe(getLatestVersionWithCache, Future.chain(runes(lang))),
    },
  }

  function getLatest<A>(
    latestDefaultLang: Store<Maybe<WithVersion<A>>>,
    fromAPI: (version: DDragonVersion, lang: Lang) => Future<A>,
  ): (lang: Lang) => (version: DDragonVersion) => Future<A> {
    return lang => version =>
      // cache only for defaultLang
      Lang.Eq.equals(lang, Lang.defaultLang)
        ? pipe(
            Future.fromIO(latestDefaultLang.get),
            Future.chain(
              flow(
                Maybe.filter(v => DDragonVersion.Eq.equals(v.version, version)),
                Maybe.fold(
                  () =>
                    pipe(
                      fromAPI(version, lang),
                      Future.chainFirstIOK(value =>
                        latestDefaultLang.set(Maybe.some({ value, version })),
                      ),
                    ),
                  v => Future.successful(v.value),
                ),
              ),
            ),
          )
        : fromAPI(version, lang)
  }
}

export { DDragonService }
