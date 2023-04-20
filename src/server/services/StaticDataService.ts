import { apply, io, string } from 'fp-ts'
import type { Eq } from 'fp-ts/Eq'
import { flow, identity, pipe } from 'fp-ts/function'
import type { Decoder } from 'io-ts/Decoder'
import * as D from 'io-ts/Decoder'
import { JSDOM } from 'jsdom'
import * as luainjs from 'lua-in-js'
import * as xml2js from 'xml2js'

import { DayJs } from '../../shared/models/DayJs'
import { Store } from '../../shared/models/Store'
import { DDragonVersion } from '../../shared/models/api/DDragonVersion'
import { Lang } from '../../shared/models/api/Lang'
import { Spell } from '../../shared/models/api/Spell'
import type { StaticData } from '../../shared/models/api/StaticData'
import { StaticDataChampion } from '../../shared/models/api/StaticDataChampion'
import { ChampionId } from '../../shared/models/api/champion/ChampionId'
import { ChampionKey } from '../../shared/models/api/champion/ChampionKey'
import { ListUtils } from '../../shared/utils/ListUtils'
import { StringUtils } from '../../shared/utils/StringUtils'
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
import type { DDragonService, VersionWithChampions } from './DDragonService'

const championDataUrl = 'https://leagueoflegends.fandom.com/wiki/Module:ChampionData/data'
const mwCodeClassName = '.mw-code'

const lolFandomApiPhpUrl = 'https://leagueoflegends.fandom.com/api.php'

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

  const fetchWikiaAramChanges: Future<Dict<string, Partial<Dict<Spell, string>>>> = pipe(
    httpClient.http(
      [lolFandomApiPhpUrl, 'get'],
      {
        searchParams: {
          action: 'parse',
          format: 'json',
          prop: 'parsetree',
          // page: 'Template:Map changes/data/aram',
          pageid: 1399551,
        },
      },
      [parseParseTreeDecoder, 'ParseParseTree'],
    ),
    Future.chain(a =>
      pipe(
        a.parse.parsetree['*'],
        parseXML(aramChangesPageParseTreeXMLDecoder, 'AramChangesPageParseTreeXML'),
      ),
    ),
    Future.chain(a => pipe(a.root.ignore[0], parseXML(includeOnlyXMLDecoder, 'IncludeOnlyXML'))),
    Future.chain(a =>
      pipe(
        a.includeonly,
        string.split('\n'),
        NonEmptyArray.init,
        List.mkString('\n'),
        string.split('\n|'),
        NonEmptyArray.tail,
        List.filterMap(
          flow(
            StringUtils.matcher3(nameSpellValueRegex),
            Maybe.map(([englishName, spell, value]) =>
              pipe(
                httpClient.http(
                  [lolFandomApiPhpUrl, 'get'],
                  {
                    searchParams: {
                      action: 'parse',
                      format: 'json',
                      contentmodel: 'wikitext',
                      text: value,
                    },
                  },
                  [parseTextDecoder, 'ParseText'],
                ),
                Future.chainEitherK(res =>
                  pipe(
                    new JSDOM(res.parse.text['*']).window.document,
                    querySelectorEnsureOne('div.mw-parser-output > *:first-child'),
                    Either.mapLeft(message =>
                      Error(`${englishName} ${spell}:\n${message}\nValue:\n${value}`),
                    ),
                  ),
                ),
                Future.map(
                  (html): ChampionNameSpellHtml => ({
                    englishName,
                    spell: spell as Spell,
                    html: html.outerHTML,
                  }),
                ),
              ),
            ),
          ),
        ),
        List.sequence(Future.ApplicativePar),
      ),
    ),
    Future.map(
      flow(
        listGroupByName,
        Dict.map(
          flow(
            NonEmptyArray.groupBy(c => c.spell),
            Dict.map(
              flow(
                NonEmptyArray.map(c => c.html),
                List.mkString(''),
              ),
            ),
          ) as (as: List<ChampionNameSpellHtml>) => Partial<Dict<Spell, string>>,
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

  function fetchAdvancedChampionData(ddragon: VersionWithChampions): Future<StaticData> {
    return pipe(
      apply.sequenceS(Future.ApplyPar)({
        championData: pipe(
          fetchWikiaChampionData,
          Future.map(flow(Dict.toReadonlyArray, List.map(Tuple.mapFst(EnglishName.wrap)))),
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
  aramChanges: Dict<EnglishName, Partial<Dict<Spell, string>>>,
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
              `- Wikia champion ${ChampionId.unwrap(champion.id)} (${ChampionKey.unwrap(
                champion.key,
              )}): ${e}`,
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

const toErrorWithUrl =
  (url: string) =>
  (e: string): Error =>
    Error(`[${url}] ${e}`)

type ChampionNameSpellHtml = {
  englishName: string
  spell: Spell
  html: string
}

const listGroupByName = List.groupBy<ChampionNameSpellHtml, string>(c => c.englishName) as (
  as: List<ChampionNameSpellHtml>,
) => Dict<string, NonEmptyArray<ChampionNameSpellHtml>>

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

const nameSpellValueRegex = RegExp(`^(.*)\\s+([${Spell.values.join('')}])\\s+=\\s*\\n(.*)$`, 's')

const parseXML =
  <A>(decoder: Decoder<unknown, A>, decoderName: string, options?: xml2js.ParserOptions) =>
  (xml: string): Future<A> =>
    pipe(
      Future.tryCatch<unknown>(() => xml2js.parseStringPromise(xml, options)),
      Future.map(flow(JSON.stringify, JSON.parse)),
      Future.chainEitherK(u =>
        pipe(decoder.decode(u), Either.mapLeft(decodeError(decoderName)(u))),
      ),
    )

const parseParseTreeDecoder = D.struct({
  parse: D.struct({
    parsetree: D.struct({
      '*': D.string,
    }),
  }),
})

const aramChangesPageParseTreeXMLDecoder = D.struct({
  root: D.struct({
    ignore: D.tuple(D.string),
  }),
})

const includeOnlyXMLDecoder = D.struct({
  includeonly: D.string,
})

const parseTextDecoder = D.struct({
  parse: D.struct({
    text: D.struct({
      '*': D.string,
    }),
  }),
})
