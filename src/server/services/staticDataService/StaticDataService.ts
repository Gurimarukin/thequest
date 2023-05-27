import { apply, io, string } from 'fp-ts'
import type { Eq } from 'fp-ts/Eq'
import { flow, identity, pipe } from 'fp-ts/function'

import { DayJs } from '../../../shared/models/DayJs'
import { Store } from '../../../shared/models/Store'
import type { ChampionSpellHtml } from '../../../shared/models/api/AramData'
import { DDragonVersion } from '../../../shared/models/api/DDragonVersion'
import { Lang } from '../../../shared/models/api/Lang'
import type { SpellName } from '../../../shared/models/api/SpellName'
import { ChampionKey } from '../../../shared/models/api/champion/ChampionKey'
import type { AdditionalStaticData } from '../../../shared/models/api/staticData/AdditionalStaticData'
import type { StaticData } from '../../../shared/models/api/staticData/StaticData'
import { StaticDataChampion } from '../../../shared/models/api/staticData/StaticDataChampion'
import type { StaticDataSummonerSpell } from '../../../shared/models/api/staticData/StaticDataSummonerSpell'
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
import type { WikiaChampionData } from '../../models/wikia/WikiaChampionData'
import { WikiaChampionPosition } from '../../models/wikia/WikiaChampionPosition'
import type { DDragonService, VersionWithChampions } from '../DDragonService'
import { getFetchWikiaAramChanges } from './getFetchWikiaAramChanges'
import { getFetchWikiaChampionData } from './getFetchWikiaChampionData'

type StaticDataService = ReturnType<typeof StaticDataService>

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const StaticDataService = (
  Logger: LoggerGetter,
  httpClient: HttpClient,
  ddragonService: DDragonService,
) => {
  const logger = Logger('StaticDataService')

  const latestDefaultLangData = Store<Maybe<StoredAt<StaticData>>>(Maybe.none)

  // keep if same version
  const getLatestDefaultLangData = (version: DDragonVersion): io.IO<Maybe<StaticData>> =>
    pipe(
      apply.sequenceS(io.Apply)({
        maybeData: latestDefaultLangData.get,
        now: DayJs.now,
      }),
      io.map(({ maybeData, now }) =>
        pipe(
          maybeData,
          Maybe.filter(
            data =>
              DDragonVersion.Eq.equals(data.value.version, version) &&
              pipe(data, StoredAt.isStillValid(constants.staticDataCacheTtl, now)),
          ),
          Maybe.map(data => data.value),
        ),
      ),
    )

  const fetchWikiaChampionData = getFetchWikiaChampionData(httpClient)
  const fetchWikiaAramChanges = getFetchWikiaAramChanges(httpClient)

  return {
    getLatest: (lang: Lang): Future<StaticData> => {
      if (!Lang.Eq.equals(lang, Lang.defaultLang)) {
        return pipe(ddragonService.latestChampions(lang), Future.chain(fetchStaticData))
      }

      return pipe(
        ddragonService.latestChampions(lang),
        Future.bindTo('ddragon'),
        Future.bind('latest', ({ ddragon }) =>
          Future.fromIO(getLatestDefaultLangData(ddragon.version)),
        ),
        Future.chain(({ ddragon, latest }) =>
          pipe(
            latest,
            Maybe.fold(
              () =>
                pipe(
                  fetchStaticData(ddragon),
                  Future.chainFirstIOK(value =>
                    pipe(
                      DayJs.now,
                      io.chain(now =>
                        latestDefaultLangData.set(Maybe.some({ value, storedAt: now })),
                      ),
                    ),
                  ),
                ),
              Future.successful,
            ),
          ),
        ),
      )
    },

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
              Dict.toReadonlyArray,
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

  function fetchStaticData(ddragon: VersionWithChampions): Future<StaticData> {
    return pipe(
      apply.sequenceS(Future.ApplyPar)({
        championData: pipe(
          fetchWikiaChampionData,
          Future.map(flow(Dict.toReadonlyArray, List.map(Tuple.mapFst(EnglishName.wrap)))),
        ),
        aramChanges: fetchWikiaAramChanges,
      }),
      Future.map(({ championData, aramChanges }) =>
        enrichChampions(ddragon.value, championData, aramChanges),
      ),
      Future.chainFirstIOEitherK(
        flow(
          List.lefts,
          NonEmptyArray.fromReadonlyArray,
          Maybe.fold(
            () => IO.notUsed,
            flow(
              NonEmptyArray.map(e => e.message),
              List.mkString(`Errors while enriching champions data:\n- `, '\n- ', ''),
              logger.warn,
            ),
          ),
        ),
      ),
      Future.map(
        flow(
          List.filterMap(
            Either.fold(
              e =>
                pipe(
                  e.champion,
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
          (champions): StaticData => ({ version: ddragon.version, champions }),
        ),
      ),
    )
  }
}

export { StaticDataService }

type EnglishName = string & {
  readonly EnglishName: unique symbol
}

const EnglishName = {
  wrap: identity as (value: string) => EnglishName,
  Eq: string.Eq as Eq<EnglishName>,
}

type ChampionError = {
  message: string // message should allow to identify the champion
  champion: Maybe<DDragonChampion>
}

const ChampionError = {
  of: (message: string, champion: Maybe<DDragonChampion>): ChampionError => ({ message, champion }),
}

const enrichChampions = (
  langDDragonChampions: DDragonChampions,
  wikiaChampions: List<Tuple<EnglishName, WikiaChampionData>>,
  aramChanges: Dict<EnglishName, PartialDict<SpellName, ChampionSpellHtml>>,
): List<Either<ChampionError, StaticDataChampion>> => {
  const withoutAramChanges: List<Either<ChampionError, Tuple<EnglishName, StaticDataChampion>>> =
    pipe(
      langDDragonChampions.data,
      Dict.toReadonlyArray,
      List.map(([, champion]) =>
        pipe(
          wikiaChampions,
          List.findFirst(([, c]) => ChampionKey.Eq.equals(c.id, champion.key)),
          Either.fromOption(() => 'not found'),
          Either.chain(([englishName, c]) =>
            pipe(
              c.positions,
              Maybe.map(NonEmptyArray.map(p => WikiaChampionPosition.position[p])),
              Either.fromOption(() => `empty positions`),
              Either.map(positions => {
                const data: StaticDataChampion = {
                  id: champion.id,
                  key: champion.key,
                  name: champion.name,
                  positions,
                  aram: {
                    stats: c.stats.aram,
                    spells: Maybe.none,
                  },
                }
                return Tuple.of(englishName, data)
              }),
            ),
          ),
          Either.mapLeft(e =>
            ChampionError.of(
              `- Wikia champion ${champion.id} (${champion.key}): ${e}`,
              Maybe.some(champion),
            ),
          ),
        ),
      ),
    )
  return pipe(
    aramChanges,
    Dict.toReadonlyArray,
    List.reduce(withoutAramChanges, (acc, [englishName, spells]) =>
      pipe(
        acc,
        ListUtils.findFirstWithIndex(
          Either.exists(([name]) => EnglishName.Eq.equals(name, englishName)),
        ),
        Maybe.fold(
          () =>
            pipe(
              acc,
              List.append(
                Either.left(
                  ChampionError.of(`- Wikia spells ${englishName}: not found`, Maybe.none),
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
