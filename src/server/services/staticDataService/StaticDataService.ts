import { apply, io, ord, readonlyMap } from 'fp-ts'
import type { Predicate } from 'fp-ts/Predicate'
import { flow, pipe } from 'fp-ts/function'

import { DayJs } from '../../../shared/models/DayJs'
import { Store } from '../../../shared/models/Store'
import { ValidatedNea } from '../../../shared/models/ValidatedNea'
import type { ChampionSpellHtml } from '../../../shared/models/api/AramData'
import { DDragonVersion } from '../../../shared/models/api/DDragonVersion'
import { Lang } from '../../../shared/models/api/Lang'
import type { SpellName } from '../../../shared/models/api/SpellName'
import { ChampionKey } from '../../../shared/models/api/champion/ChampionKey'
import type { AdditionalStaticData } from '../../../shared/models/api/staticData/AdditionalStaticData'
import type { StaticData } from '../../../shared/models/api/staticData/StaticData'
import { StaticDataChampion } from '../../../shared/models/api/staticData/StaticDataChampion'
import type { StaticDataSummonerSpell } from '../../../shared/models/api/staticData/StaticDataSummonerSpell'
import { DictUtils } from '../../../shared/utils/DictUtils'
import { ListUtils } from '../../../shared/utils/ListUtils'
import type { PartialDict } from '../../../shared/utils/fp'
import {
  Dict,
  Either,
  Future,
  IO,
  List,
  Maybe,
  NonEmptyArray,
  Tuple,
} from '../../../shared/utils/fp'

import { constants } from '../../config/constants'
import type { HttpClient } from '../../helpers/HttpClient'
import { StoredAt } from '../../models/StoredAt'
import type { LoggerGetter } from '../../models/logger/LoggerGetter'
import type { DDragonChampion } from '../../models/riot/ddragon/DDragonChampion'
import type { DDragonChampions } from '../../models/riot/ddragon/DDragonChampions'
import { ChampionEnglishName } from '../../models/wikia/ChampionEnglishName'
import type { WikiaAramChanges } from '../../models/wikia/WikiaAramChanges'
import type { WikiaChampionData } from '../../models/wikia/WikiaChampionData'
import { WikiaChampionPosition } from '../../models/wikia/WikiaChampionPosition'
import type { DDragonService } from '../DDragonService'
import { getFetchWikiaAramChanges } from './getFetchWikiaAramChanges'
import { getFetchWikiaChampionsData } from './getFetchWikiaChampionsData'

type StaticDataService = ReturnType<typeof StaticDataService>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const StaticDataService = (
  Logger: LoggerGetter,
  httpClient: HttpClient,
  ddragonService: DDragonService,
) => {
  const logger = Logger('StaticDataService')

  const fetchDefautLangStaticData = fetchCached(
    (version: DDragonVersion): Future<StaticData> =>
      pipe(
        apply.sequenceS(Future.ApplyPar)({
          requestedLang: ddragonService.champions(Lang.defaultLang)(version),
          english: ddragonService.champions(Lang.english)(version),
        }),
        Future.chain(flow(withEnglishData, fetchStaticData(version))),
      ),
    version => data => DDragonVersion.Eq.equals(data.value.version, version),
  )

  const fetchWikiaChampionsData: Future<List<WikiaChampionData>> = fetchCachedSimple(
    getFetchWikiaChampionsData(logger, httpClient),
  )

  const fetchWikiaAramChanges: Future<WikiaAramChanges> = getFetchWikiaAramChanges(httpClient)

  return {
    wikiaChampions: fetchWikiaChampionsData,

    getLatest: (lang: Lang): Future<StaticData> =>
      pipe(
        ddragonService.latestVersion,
        Future.chain(version => {
          if (Lang.Eq.equals(lang, Lang.defaultLang)) return fetchDefautLangStaticData(version)

          const futureEnglish = ddragonService.champions(Lang.english)(version)
          return pipe(
            apply.sequenceS(Future.ApplyPar)({
              requestedLang: Lang.Eq.equals(lang, Lang.english)
                ? futureEnglish
                : ddragonService.champions(lang)(version),
              english: futureEnglish,
            }),
            Future.chain(flow(withEnglishData, fetchStaticData(version))),
          )
        }),
      ),

    getLatestAdditional: (lang: Lang): Future<AdditionalStaticData> =>
      pipe(
        ddragonService.latestVersion,
        Future.chain(version =>
          pipe(
            apply.sequenceS(Future.ApplicativePar)({
              version: Future.successful(version),
              summoners: ddragonService.summoners(lang)(version),
              runeStyles: ddragonService.runeStyles(lang)(version),
              runes: ddragonService.cdragon.latestRunes(lang),
            }),
          ),
        ),
        Future.map(
          ({ version, summoners, runeStyles, runes }): AdditionalStaticData => ({
            version,
            summonerSpells: pipe(
              summoners.data,
              DictUtils.entries,
              List.map(
                flow(
                  Tuple.snd,
                  (s): StaticDataSummonerSpell => ({
                    ...s,
                    cooldown: NonEmptyArray.head(s.cooldown),
                  }),
                ),
              ),
            ),
            runeStyles: pipe(
              runeStyles,
              List.map(style => ({
                ...style,
                slots: pipe(
                  style.slots,
                  List.map(slot => ({
                    runes: pipe(
                      slot.runes,
                      List.map(rune => rune.id),
                    ),
                  })),
                ),
              })),
            ),
            runes,
          }),
        ),
      ),
  }

  /**
   * We need english champion names because wikia's aram changes are only retrievable with the english name.
   * But we also want requestedLang, as we want translated champions for front.
   */
  function fetchStaticData(
    version: DDragonVersion,
  ): (champions: ChampionsWithEnglish) => Future<StaticData> {
    return championsWithEnglish =>
      pipe(
        apply.sequenceS(Future.ApplyPar)({
          wikiaChampions: fetchWikiaChampionsData,
          aramChanges: fetchWikiaAramChanges,
        }),
        Future.map(({ wikiaChampions, aramChanges }) =>
          enrichChampions(championsWithEnglish, wikiaChampions, aramChanges),
        ),
        Future.chainFirstIOEitherK(
          flow(
            List.lefts,
            NonEmptyArray.fromReadonlyArray,
            Maybe.fold(() => IO.notUsed, flow(logChampionErrors, logger.warn)),
          ),
        ),
        Future.map(
          flow(
            List.filterMap(
              Either.fold(
                e =>
                  pipe(
                    e.nonFatalChampion,
                    Maybe.map(
                      (c): StaticDataChampion => ({
                        id: c.id,
                        key: c.key,
                        name: c.name,
                        positions: [],
                        aram: {
                          stats: Maybe.none,
                          spells: Maybe.none,
                        },
                      }),
                    ),
                  ),
                Maybe.some,
              ),
            ),
            (champions): StaticData => ({ version, champions }),
          ),
        ),
      )
  }
}

export { StaticDataService }

const withEnglishData: <K extends string>(
  fa: Dict<K, DDragonChampions>,
) => Dict<K, List<DDragonChampion>> = Dict.map(a => DictUtils.values(a.data))

type ChampionsWithEnglish = {
  requestedLang: List<DDragonChampion>
  english: List<DDragonChampion>
}

const enrichChampions = (
  {
    requestedLang: requestedLangDDragonChampions,
    english: englishDDragonChampions,
  }: ChampionsWithEnglish,
  wikiaChampions: List<WikiaChampionData>,
  aramChanges: ReadonlyMap<ChampionEnglishName, PartialDict<SpellName, ChampionSpellHtml>>,
): List<Either<ChampionError, StaticDataChampion>> => {
  const withoutAramChanges: List<
    Either<ChampionError, Tuple<ChampionEnglishName, StaticDataChampion>>
  > = pipe(
    requestedLangDDragonChampions,
    List.map(requestedLangChampion =>
      pipe(
        apply.sequenceS(ValidatedNea.getValidation<string>())({
          englishChampion: pipe(
            englishDDragonChampions,
            List.findFirst(c => ChampionKey.Eq.equals(c.key, requestedLangChampion.key)),
            ValidatedNea.fromOption(() => 'english champion not found'),
          ),
          wikiaChampion: pipe(
            wikiaChampions,
            List.findFirst(c => ChampionKey.Eq.equals(c.id, requestedLangChampion.key)),
            ValidatedNea.fromOption(() => 'wikiaChampion not found'),
          ),
        }),
        Either.bind('positions', ({ wikiaChampion }) =>
          pipe(
            wikiaChampion.positions,
            ValidatedNea.fromOption(() => 'empty positons'),
          ),
        ),
        Either.bimap(
          messages =>
            ChampionError.of(
              'Wikia champion',
              `${requestedLangChampion.id} (${requestedLangChampion.key})`,
              messages,
              Maybe.some(requestedLangChampion),
            ),
          ({ englishChampion, wikiaChampion, positions }) => {
            const data: StaticDataChampion = {
              id: requestedLangChampion.id,
              key: requestedLangChampion.key,
              name: requestedLangChampion.name,
              positions: pipe(
                positions,
                NonEmptyArray.map(p => WikiaChampionPosition.position[p]),
              ),
              aram: {
                stats: wikiaChampion.stats.aram,
                spells: Maybe.none,
              },
            }

            return Tuple.of(ChampionEnglishName.wrap(englishChampion.name), data)
          },
        ),
      ),
    ),
  )
  return pipe(
    aramChanges,
    readonlyMap.reduceWithIndex<ChampionEnglishName>(ord.trivial)(
      withoutAramChanges,
      (englishName, acc, spells) =>
        pipe(
          acc,
          ListUtils.findFirstWithIndex(
            Either.exists(([name]) => ChampionEnglishName.Eq.equals(name, englishName)),
          ),
          Maybe.fold(
            () =>
              pipe(
                acc,
                List.append(
                  Either.left(
                    ChampionError.of(
                      'Wikia spells',
                      ChampionEnglishName.unwrap(englishName),
                      ['not found'],
                      Maybe.none,
                    ),
                  ),
                ),
              ),
            ([i, data]) =>
              List.unsafeUpdateAt(
                i,
                pipe(
                  data,
                  Either.map(
                    Tuple.mapSnd(StaticDataChampion.Lens.aramSpells.set(Maybe.some(spells))),
                  ),
                ),
                acc,
              ),
          ),
        ),
    ),
    List.map(Either.map(Tuple.snd)),
  )
}

type ChampionError = {
  type: string
  id: string // a way to identify the champion
  messages: NonEmptyArray<string>
  nonFatalChampion: Maybe<DDragonChampion> // if non fatal error, actual champion
}

const ChampionError = {
  of: (
    type: string,
    id: string,
    messages: NonEmptyArray<string>,
    nonFatalChampion: Maybe<DDragonChampion>,
  ): ChampionError => ({
    type,
    id,
    messages,
    nonFatalChampion,
  }),
}

const logChampionErrors: (errors: NonEmptyArray<ChampionError>) => string = flow(
  NonEmptyArray.map(e => {
    const sep = e.messages.length === 1 ? ' ' : '\n  - '
    return pipe(e.messages, List.mkString(`${e.type} ${e.id}:${sep}`, sep, ''))
  }),
  List.mkString('Errors while enriching champions data:\n- ', '\n- ', ''),
)

/**
 * cache utils
 */

const fetchCachedSimple = <A>(
  fetch: Future<A>,
  getCacheFilter?: Predicate<StoredAt<A>>,
): Future<A> =>
  fetchCached(() => fetch, getCacheFilter !== undefined ? () => getCacheFilter : undefined)()

const fetchCached = <A, Args extends List<unknown>>(
  fetch: (...args: Args) => Future<A>,
  getCacheFilter: (...args: Args) => Predicate<StoredAt<A>> = () => () => true,
): ((...args: Args) => Future<A>) => {
  const cache = Store<Maybe<StoredAt<A>>>(Maybe.none)

  return (...args: Args): Future<A> =>
    pipe(
      apply.sequenceS(io.Apply)({
        maybeData: cache.get,
        now: DayJs.now,
      }),
      io.map(({ maybeData, now }) =>
        pipe(
          maybeData,
          Maybe.filter(
            data =>
              getCacheFilter(...args)(data) &&
              pipe(data, StoredAt.isStillValid(constants.staticDataCacheTtl, now)),
          ),
          Maybe.map(data => data.value),
        ),
      ),
      Future.fromIO,
      Future.chain(
        Maybe.fold(
          () =>
            pipe(
              fetch(...args),
              Future.chainFirstIOK(value =>
                pipe(
                  DayJs.now,
                  io.chain(now => cache.set(Maybe.some({ value, storedAt: now }))),
                ),
              ),
            ),
          Future.successful,
        ),
      ),
    )
}
