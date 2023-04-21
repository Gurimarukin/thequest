import { string } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import type { Decoder } from 'io-ts/Decoder'
import * as D from 'io-ts/Decoder'
import xml2js from 'xml2js'

import { Spell } from '../../../shared/models/api/Spell'
import { StringUtils } from '../../../shared/utils/StringUtils'
import type { Tuple3 } from '../../../shared/utils/fp'
import {
  Dict,
  Either,
  Future,
  List,
  Maybe,
  NonEmptyArray,
  PartialDict,
} from '../../../shared/utils/fp'
import { decodeError } from '../../../shared/utils/ioTsUtils'

import { DomHandler } from '../../helpers/DomHandler'
import type { HttpClient } from '../../helpers/HttpClient'

const lolFandomApiPhpUrl = 'https://leagueoflegends.fandom.com/api.php'

export const getFetchWikiaAramChanges = (
  httpClient: HttpClient,
): Future<Dict<string, Partial<Dict<Spell, string>>>> =>
  pipe(
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
            StringUtils.matcher3(nameSpellValueRegex) as (
              str: string,
            ) => Maybe<Tuple3<string, Spell, string>>,
            Maybe.map(parseChampionChanges(httpClient)),
          ),
        ),
        List.sequence(Future.ApplicativePar),
      ),
    ),
    Future.map(
      flow(
        List.groupByStr(c => c.englishName),
        Dict.map(nea =>
          pipe(
            nea,
            List.groupBy(c => c.spell),
            PartialDict.map(
              flow(
                NonEmptyArray.map(c => c.html),
                List.mkString(''),
              ),
            ),
          ),
        ),
      ),
    ),
  )

const parseChampionChanges =
  (httpClient: HttpClient) =>
  ([englishName, spell, value]: Tuple3<string, Spell, string>): Future<ChampionNameSpellHtml> =>
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
      Future.chainEitherK(res => DomHandler.of(res.parse.text['*'])),
      Future.chainEitherK(domHandler =>
        pipe(
          domHandler.window.document,
          DomHandler.querySelectorEnsureOne('div.mw-parser-output > *:first-child'),
          Either.bimap(
            message => Error(`${englishName} ${spell}:\n${message}\nValue:\n${value}`),
            firstChild => {
              // eslint-disable-next-line functional/no-expression-statements
              firstChild.querySelectorAll('script').forEach(e => e.remove())
              return firstChild
            },
          ),
        ),
      ),
      Future.map(
        (firstChild): ChampionNameSpellHtml => ({
          englishName,
          spell,
          html: firstChild.outerHTML,
        }),
      ),
    )

type ChampionNameSpellHtml = {
  englishName: string
  spell: Spell
  html: string
}

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

const nameSpellValueRegex = RegExp(`^(.*)\\s+([${Spell.values.join('')}])\\s+=\\s*\\n(.*)$`, 's')

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
