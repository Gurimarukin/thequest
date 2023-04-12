import { apply, io } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import { JSDOM } from 'jsdom'
import * as luainjs from 'lua-in-js'

import { DayJs } from '../../shared/models/DayJs'
import { Store } from '../../shared/models/Store'
import { DDragonVersion } from '../../shared/models/api/DDragonVersion'
import type { Lane } from '../../shared/models/api/Lane'
import { Lang } from '../../shared/models/api/Lang'
import type { StaticData } from '../../shared/models/api/StaticData'
import type { StaticDataChampion } from '../../shared/models/api/StaticDataChampion'
import { ChampionId } from '../../shared/models/api/champion/ChampionId'
import { ChampionKey } from '../../shared/models/api/champion/ChampionKey'
import {
  Dict,
  Either,
  Future,
  IO,
  List,
  Maybe,
  NonEmptyArray,
  Try,
  Tuple,
} from '../../shared/utils/fp'
import { decodeError } from '../../shared/utils/ioTsUtils'

import { constants } from '../config/constants'
import type { HttpClient } from '../helpers/HttpClient'
import { StoredAt } from '../models/StoredAt'
import type { LoggerGetter } from '../models/logger/LoggerGetter'
import type { DDragonChampion } from '../models/riot/ddragon/DDragonChampion'
import type { DDragonChampions } from '../models/riot/ddragon/DDragonChampions'
import type { WikiaChampion } from '../models/wikia/WikiaChampion'
import { WikiaChampionPosition } from '../models/wikia/WikiaChampionPosition'
import { WikiaChampions } from '../models/wikia/WikiaChampions'
import type { DDragonService, VersionWithChampions } from './DDragonService'

const championDataUrl = 'https://leagueoflegends.fandom.com/wiki/Module:ChampionData/data'
const mwCodeClassName = '.mw-code'

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

  const fetchWikiaChampionData: Future<WikiaChampions> = pipe(
    httpClient.text([championDataUrl, 'get']),
    Future.chainEitherK(body => Try.tryCatch(() => new JSDOM(body))),
    Future.chainEitherK(jsdom => {
      const mwCodes = jsdom.window.document.querySelectorAll(mwCodeClassName)

      if (1 < mwCodes.length) {
        return Try.failure(
          Error(`[${championDataUrl}] More than one element matches selector: ${mwCodeClassName}`),
        )
      }

      const mwCode = mwCodes[0]
      return mwCode === undefined
        ? Try.failure(Error(`[${championDataUrl}] No element matches selector: ${mwCodeClassName}`))
        : Try.success(mwCode.textContent)
    }),
    Future.chainEitherK(
      Try.fromNullable(
        Error(`[${championDataUrl}] empty text content for selector: ${mwCodeClassName}`),
      ),
    ),
    Future.map(str => luainjs.createEnv().parse(str).exec()),
    Future.chainEitherK(u =>
      pipe(WikiaChampions.decoder.decode(u), Either.mapLeft(decodeError('WikiaChampions')(u))),
    ),
  )

  return {
    getLatest: (lang: Lang): Future<StaticData> => {
      if (!Lang.Eq.equals(lang, Lang.defaultLang)) {
        return pipe(
          ddragonService.latestDataChampions(lang),
          Future.chain(fetchAdvancedChampionData),
        )
      }

      return pipe(
        ddragonService.latestDataChampions(lang),
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
                  fetchAdvancedChampionData(ddragon),
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
  }

  function fetchAdvancedChampionData(ddragon: VersionWithChampions): Future<StaticData> {
    return pipe(
      fetchWikiaChampionData,
      Future.map(
        flow(Dict.toReadonlyArray, List.map(Tuple.snd), enrichChampions(ddragon.champions)),
      ),
      Future.chainFirstIOEitherK(
        flow(
          List.lefts,
          NonEmptyArray.fromReadonlyArray,
          Maybe.fold(
            () => IO.notUsed,
            flow(
              NonEmptyArray.map(
                ([c, e]) =>
                  `- Wikia champion ${ChampionId.unwrap(c.id)} (${ChampionKey.unwrap(
                    c.key,
                  )}): ${e}`,
              ),
              List.mkString(`Errors while enriching champions data:\n`, '\n', ''),
              logger.warn,
            ),
          ),
        ),
      ),
      Future.map(
        flow(
          List.map(
            Either.getOrElse(
              ([c]): StaticDataChampion => ({
                id: c.id,
                key: c.key,
                name: c.name,
                lanes: [],
              }),
            ),
          ),
          (champions): StaticData => ({ version: ddragon.version, champions }),
        ),
      ),
    )
  }
}

export { StaticDataService }

const enrichChampions =
  (ddragonChampions: DDragonChampions) =>
  (
    wikiaChampions: List<WikiaChampion>,
  ): List<Either<Tuple<DDragonChampion, string>, StaticDataChampion>> =>
    pipe(
      ddragonChampions.data,
      Dict.toReadonlyArray,
      List.map(
        ([, c]): Either<Tuple<DDragonChampion, string>, StaticDataChampion> =>
          pipe(
            wikiaChampions,
            List.findFirst(c_ => ChampionKey.Eq.equals(c_.id, c.key)),
            Either.fromOption(() => 'not found'),
            Either.chain(c_ =>
              pipe(
                c_.op_positions,
                Maybe.map(NonEmptyArray.map(p => WikiaChampionPosition.lane[p])),
                Maybe.alt(() =>
                  pipe(
                    wikiaMissingOpPosisions,
                    Dict.lookup(ChampionKey.fromStringCodec.encode(c.key)),
                  ),
                ),
                Either.fromOption(() => `empty op_positions`),
              ),
            ),
            Either.bimap(
              e => Tuple.of(c, e),
              (lanes): StaticDataChampion => ({
                id: c.id,
                key: c.key,
                name: c.name,
                lanes,
              }),
            ),
          ),
      ),
    )

const wikiaMissingOpPosisions: Dict<string, NonEmptyArray<Lane>> = {
  147: ['middle', 'bottom', 'support'], // Seraphine
  526: ['support'], // Rell
  777: ['top', 'middle', 'bottom'], // Yone
}
