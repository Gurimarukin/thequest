import { apply, io, ord } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'

import { DayJs } from '../../shared/models/DayJs'
import type { MsDuration } from '../../shared/models/MsDuration'
import { Store } from '../../shared/models/Store'
import { DDragonVersion } from '../../shared/models/api/DDragonVersion'
import { Lang } from '../../shared/models/api/Lang'
import { Future, Maybe, NonEmptyArray } from '../../shared/utils/fp'

import { constants } from '../config/constants'
import type { DDragonChampions } from '../models/riot/ddragon/DDragonChampions'
import type { RiotApiService } from './RiotApiService'

type StoredAt<A> = {
  value: A
  storedAt: DayJs
}

const StoredAt = {
  /**
   *                 ttl
   *  <-------------------------------->
   * |----------------|-----------------|
   * now - ttl     storedAt           now
   */
  isStillValid:
    (ttl: MsDuration, now: DayJs) =>
    <A>({ storedAt }: StoredAt<A>): boolean =>
      ord.leq(DayJs.Ord)(pipe(now, DayJs.subtract(ttl)), storedAt),
}

type WithVersion<A> = {
  value: A
  version: DDragonVersion
}

type VersionWithChampions = {
  version: DDragonVersion
  champions: DDragonChampions
}

type DDragonService = ReturnType<typeof DDragonService>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const DDragonService = (riotApiService: RiotApiService) => {
  const latestVersion = Store<Maybe<StoredAt<DDragonVersion>>>(Maybe.none)
  const latestDefaultLangDataChampions = Store<Maybe<WithVersion<DDragonChampions>>>(Maybe.none)

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
        Maybe.filter(StoredAt.isStillValid(constants.riotApi.cacheTtl.ddragonLatestVersion, now)),
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

  return {
    latestDataChampions: (lang: Lang): Future<VersionWithChampions> =>
      pipe(
        getLatestVersionWithCache,
        Future.bindTo('version'),
        Future.bind('champions', ({ version }) =>
          // cache only for defaultLang
          Lang.Eq.equals(lang, Lang.defaultLang)
            ? pipe(
                Future.fromIO(latestDefaultLangDataChampions.get),
                Future.chain(
                  flow(
                    Maybe.filter(v => DDragonVersion.Eq.equals(v.version, version)),
                    Maybe.fold(
                      () =>
                        pipe(
                          riotApiService.leagueoflegends.ddragon.cdn(version).data(lang).champion,
                          Future.chainFirstIOK(value =>
                            latestDefaultLangDataChampions.set(Maybe.some({ value, version })),
                          ),
                        ),
                      v => Future.successful(v.value),
                    ),
                  ),
                ),
              )
            : riotApiService.leagueoflegends.ddragon.cdn(version).data(lang).champion,
        ),
      ),
  }
}

export { DDragonService }
