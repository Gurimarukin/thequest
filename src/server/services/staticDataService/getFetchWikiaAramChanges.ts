import { apply, string } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import type { Decoder } from 'io-ts/Decoder'
import * as D from 'io-ts/Decoder'
import xml2js from 'xml2js'

import type { ChampionSpellHtml } from '../../../shared/models/api/AramData'
import { SpellName } from '../../../shared/models/api/SpellName'
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

import { constants } from '../../config/constants'
import { DomHandler } from '../../helpers/DomHandler'
import type { HttpClient } from '../../helpers/HttpClient'
import type { WikiaAramChanges } from '../../models/wikia/WikiaAramChanges'

const apiPhpUrl = `${constants.lolWikiaDomain}/api.php`

export const getFetchWikiaAramChanges = (httpClient: HttpClient): Future<WikiaAramChanges> => {
  return pipe(
    httpClient.http(
      [apiPhpUrl, 'get'],
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
            ) => Maybe<Tuple3<string, SpellName, string>>,
            Maybe.map(parseChampionChanges),
          ),
        ),
        List.sequence(Future.ApplicativePar),
      ),
    ),
    Future.map(
      flow(
        List.groupByStr(c => c.englishName),
        Dict.map(
          flow(
            List.groupBy(c => c.spell),
            PartialDict.map(
              (nea): ChampionSpellHtml => ({
                spell: NonEmptyArray.head(nea).html.spell,
                description: pipe(
                  nea,
                  NonEmptyArray.map(c => c.html.description),
                  List.mkString(''),
                ),
              }),
            ),
          ),
        ),
      ),
    ),
  )

  function parseChampionChanges([englishName, spell, value]: Tuple3<
    string,
    SpellName,
    string
  >): Future<ChampionSpellHtmlDescription> {
    return pipe(
      apply.sequenceS(Future.ApplyPar)({
        spell: parseSpellWikiText(englishName, spell, `{{ai|${spell}|${englishName}}}`),
        description: parseSpellWikiText(englishName, spell, value),
      }),
      Future.map((html): ChampionSpellHtmlDescription => ({ englishName, spell, html })),
    )
  }

  function parseSpellWikiText(
    englishName: string,
    spell: SpellName,
    value: string,
  ): Future<string> {
    return pipe(
      httpClient.http(
        [apiPhpUrl, 'get'],
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
              /* eslint-disable functional/no-expression-statements */
              firstChild.querySelectorAll('script').forEach(e => e.remove())

              firstChild.querySelectorAll('img').forEach(e =>
                pipe(
                  e.src,
                  StringUtils.matcher1(imageRegex),
                  Maybe.fold(
                    () => undefined,
                    newStr => e.setAttribute('src', newStr),
                  ),
                ),
              )

              firstChild.querySelectorAll('a').forEach(e => {
                e.setAttribute('href', new URL(e.href, constants.lolWikiaDomain).toString())
                e.setAttribute('target', '_blank')
                e.setAttribute('rel', 'noreferrer')
              })

              firstChild.querySelectorAll('.inline-image').forEach(e => e.removeAttribute('style'))
              /* eslint-enable functional/no-expression-statements */

              return firstChild
            },
          ),
        ),
      ),
      Future.map(firstChild => firstChild.outerHTML),
    )
  }
}

type ChampionSpellHtmlDescription = {
  englishName: string
  spell: SpellName
  html: ChampionSpellHtml
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

// Akshan Q = \n* Scoundrel duration reduced to 25 seconds.
const nameSpellValueRegex = RegExp(
  `^(.*)\\s+([${SpellName.values.join('')}])\\s+=\\s*\\n(.*)$`,
  's',
)

// https://static.wikia.nocookie.net/leagueoflegends/images/e/e9/Akshan_Going_Rogue.png/revision/latest/scale-to-width-down/20?cb=20210827174804
const imageRegex = /^(.*\.png).*$/

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
