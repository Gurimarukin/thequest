import { apply, io } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import * as D from 'io-ts/Decoder'
import { JSDOM } from 'jsdom'
import * as luainjs from 'lua-in-js'
import parsoid from 'parsoid'

import { DayJs } from '../../shared/models/DayJs'
import { Store } from '../../shared/models/Store'
import { DDragonVersion } from '../../shared/models/api/DDragonVersion'
import { Lang } from '../../shared/models/api/Lang'
import { Spell } from '../../shared/models/api/Spell'
import type { StaticData } from '../../shared/models/api/StaticData'
import type { StaticDataChampion } from '../../shared/models/api/StaticDataChampion'
import { ChampionId } from '../../shared/models/api/champion/ChampionId'
import { ChampionKey } from '../../shared/models/api/champion/ChampionKey'
import { StringUtils } from '../../shared/utils/StringUtils'
import type { Tuple3 } from '../../shared/utils/fp'
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
import type { WikiaChampionData } from '../models/wikia/WikiaChampionData'
import { WikiaChampionPosition } from '../models/wikia/WikiaChampionPosition'
import { WikiaChampionsData } from '../models/wikia/WikiaChampionsData'
import { StrictStruct } from '../utils/ioTsUtils'
import type { DDragonService, VersionWithChampions } from './DDragonService'

const championDataUrl = 'https://leagueoflegends.fandom.com/wiki/Module:ChampionData/data'
const mwCodeClassName = '.mw-code'

const aramMapChangesUrl =
  'https://leagueoflegends.fandom.com/wiki/Template:Map_changes/data/aram?action=edit'
const dataMwAttribute = 'data-mw'

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

  const fetchWikiaChampionData: Future<WikiaChampionsData> = pipe(
    httpClient.text([championDataUrl, 'get']),
    Future.chainEitherK(body => Try.tryCatch(() => new JSDOM(body))),
    Future.chainEitherK(jsdom =>
      pipe(
        jsdom.window.document,
        querySelectorEnsureOne(mwCodeClassName),
        Either.mapLeft(toErrorWithUrl(championDataUrl)),
      ),
    ),
    Future.map(mwCode => mwCode.textContent),
    Future.chainEitherK(
      Try.fromNullable(
        Error(`[${championDataUrl}] empty text content for selector: ${mwCodeClassName}`),
      ),
    ),
    Future.map(str => luainjs.createEnv().parse(str).exec()),
    Future.chainEitherK(u =>
      pipe(
        WikiaChampionsData.decoder.decode(u),
        Either.mapLeft(decodeError('WikiaChampionsData')(u)),
      ),
    ),
  )

  const fetchWikiaAramChanges: Future<Dict<string, Dict<Spell, string>>> = pipe(
    httpClient.text([aramMapChangesUrl, 'get']),
    Future.chainEitherK(body => Try.tryCatch(() => new JSDOM(body))),
    Future.chainEitherK(pageDom =>
      pipe(
        pageDom.window.document,
        querySelectorEnsureOne('#wpTextbox1', pageDom.window.HTMLTextAreaElement),
        Either.chain(textArea => {
          const textAreaDom = new JSDOM(textArea.value)
          return pipe(textAreaDom.window.document, querySelectorEnsureOne('includeonly'))
        }),
        Either.mapLeft(toErrorWithUrl(aramMapChangesUrl)),
      ),
    ),
    Future.chain(includeonly => parsoidParse(includeonly.innerHTML)),
    Future.chainEitherK(html =>
      pipe(
        new JSDOM(html).window.document,
        querySelectorEnsureOne('span'),
        Either.chainNullableK(`Missing attribute ${dataMwAttribute}`)(span =>
          span.getAttribute(dataMwAttribute),
        ),
        Either.mapLeft(toErrorWithUrl(aramMapChangesUrl)),
      ),
    ),
    Future.map<string, unknown>(JSON.parse),
    Future.chainEitherK(u =>
      pipe(dataMwDecoder.decode(u), Either.mapLeft(decodeError('DataMw')(u))),
    ),
    Future.chain(data =>
      pipe(
        NonEmptyArray.head(data.parts).template.params,
        Dict.toReadonlyArray,
        List.filterMap(([key, param]) =>
          pipe(
            decodeChampionSpell(key),
            Maybe.map(([champion, spell]) =>
              pipe(
                parsoidParse(param.wt),
                Future.map(html => [champion, spell, html] as const),
              ),
            ),
          ),
        ),
        List.sequence(Future.ApplicativePar),
      ),
    ),
    Future.map(
      flow(
        listGroupByChampion,
        Dict.map(
          flow(
            NonEmptyArray.groupBy(([, spell]) => spell),
            Dict.map(
              flow(
                NonEmptyArray.map(([, , html]) => html),
                List.mkString('\n'),
              ),
            ),
          ),
        ),
      ),
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

  function fetchAdvancedChampionData(ddragon: VersionWithChampions, english): Future<StaticData> {
    return pipe(
      apply.sequenceS(Future.ApplyPar)({
        championData: pipe(
          fetchWikiaChampionData,
          Future.map(flow(Dict.toReadonlyArray, List.map(Tuple.snd))),
        ),
        aramChanges: fetchWikiaAramChanges,
      }),
      Future.map(({ championData, aramChanges }) =>
        enrichChampions(ddragon.champions, championData, aramChanges),
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
                positions: [],
                aram: {
                  stats: Maybe.none,
                  spells: Maybe.none,
                },
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

const enrichChampions = (
  ddragonChampions: DDragonChampions,
  wikiaChampions: List<WikiaChampionData>,
  aramChanges: Dict<string, Dict<Spell, string>>,
): List<Either<Tuple<DDragonChampion, string>, StaticDataChampion>> =>
  pipe(
    ddragonChampions.data,
    Dict.toReadonlyArray,
    List.map(
      ([, champion]): Either<Tuple<DDragonChampion, string>, StaticDataChampion> =>
        pipe(
          wikiaChampions,
          List.findFirst(c => ChampionKey.Eq.equals(c.id, champion.key)),
          Either.fromOption(() => 'not found'),
          Either.chain(c =>
            pipe(
              c.positions,
              Maybe.map(NonEmptyArray.map(p => WikiaChampionPosition.position[p])),
              Either.fromOption(() => `empty positions`),
              Either.map(
                (positions): StaticDataChampion => ({
                  id: champion.id,
                  key: champion.key,
                  name: champion.name,
                  positions,
                  aram: {
                    stats: c.stats.aram,
                  },
                }),
              ),
            ),
          ),
          Either.mapLeft(e => Tuple.of(champion, e)),
        ),
    ),
  )

const toErrorWithUrl =
  (url: string) =>
  (e: string): Error =>
    Error(`[${url}] ${e}`)

type ChampSpellHtml = Tuple3<string, Spell, string>

const listGroupByChampion = List.groupBy<ChampSpellHtml, string>(([champion]) => champion) as (
  as: List<ChampSpellHtml>,
) => Dict<string, NonEmptyArray<ChampSpellHtml>>

type Constructor<E> = {
  new (): E
  prototype: E
}

function querySelectorEnsureOne(selector: string): (parent: ParentNode) => Either<string, Element>
function querySelectorEnsureOne<E extends Element>(
  selector: string,
  type: Constructor<E>,
): (parent: ParentNode) => Either<string, E>
function querySelectorEnsureOne<E extends Element>(
  selector: string,
  type?: Constructor<E>,
): (parent: ParentNode) => Either<string, E> {
  return parent => {
    const res = parent.querySelectorAll(selector)

    if (1 < res.length) return Either.left(`More than one element matches selector: ${selector}`)

    const elt = res[0]
    if (elt === undefined) return Either.left(`No element matches selector: ${selector}`)

    if (type === undefined) return Either.right(elt as E)

    const isE = (e: Element): e is E => e instanceof type
    if (isE(elt)) return Either.right(elt)

    return Either.left(`Element don't have expected type: ${type.name}`)
  }
}

const parsoidParse = (input: string): Future<string> =>
  Future.tryCatch(
    () =>
      new Promise<string>(resolve =>
        parsoid
          .parse({
            input,
            mode: 'wt2html',
            parsoidOptions: {
              linting: false,
              loadWMF: true, // true,
              useWorker: false,
              fetchConfig: true, // true,
              fetchTemplates: true, // true,
              fetchImageInfo: true, // true,
              expandExtensions: true, // true,
              rtTestMode: false,
              addHTMLTemplateParameters: false,
              usePHPPreProcessor: true, // true,
            },
            envOptions: {
              domain: 'en.wikipedia.org',
              prefix: null,
              pageName: '',
              scrubWikitext: false,
              pageBundle: false,
              wrapSections: false,
              logLevels: ['fatal', 'error', 'warn'],
            },
            oldid: null,
            contentmodel: null,
            outputContentVersion: '2.1.0',
            body_only: true,
          })
          .then((res: { html: string }) => resolve(res.html))
          .done(),
      ),
  )

const spellRegex = RegExp(`^(.*) ([${Spell.values.join('')}])$`)

const decodeChampionSpell = (raw: string): Maybe<Tuple<string, Spell>> =>
  pipe(raw, StringUtils.matcher2(spellRegex)) as Maybe<Tuple<string, Spell>>

const dataMwDecoder = StrictStruct.decoder({
  parts: NonEmptyArray.decoder(
    StrictStruct.decoder({
      template: StrictStruct.decoder({
        target: StrictStruct.decoder({
          wt: D.string,
          function: D.literal('switch'),
        }),
        params: D.record(
          StrictStruct.decoder({
            wt: D.string,
          }),
        ),
        i: D.number,
      }),
    }),
  ),
})
