import { XMLBuilder, XMLParser } from 'fast-xml-parser'
import { string, task } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import type { Decoder } from 'io-ts/Decoder'
import * as D from 'io-ts/Decoder'
import { JSDOM } from 'jsdom'
import util from 'util'
import * as xml2js from 'xml2js'

import { MsDuration } from '../../../../src/shared/models/MsDuration'
import { Spell } from '../../../../src/shared/models/api/Spell'
import { StringUtils } from '../../../../src/shared/utils/StringUtils'
import { Dict, Either, Future, List, Maybe, NonEmptyArray } from '../../../../src/shared/utils/fp'
import { decodeError } from '../../../../src/shared/utils/ioTsUtils'

import { HttpClient } from '../../../../src/server/helpers/HttpClient'
import { LoggerGetter } from '../../../../src/server/models/logger/LoggerGetter'

import { expectT } from '../../../expectT'

const xmlParser = new XMLParser({
  preserveOrder: true,
})
const xmlBuilder = new XMLBuilder({
  preserveOrder: true,
  processEntities: false,
})

describe('toto', () => {
  const httpClient = HttpClient(LoggerGetter('trace'))

  // it.only('should decode', () => {
  //   const data = {
  //     root: {
  //       _: '\n[[Category:Templates]]',
  //       ignore: ['<includeonly>...</includeonly>', '<noinclude>', '</noinclude>'],
  //       template: [{ title: ['doc'] }],
  //     },
  //   }

  //   expectT(
  //     pipe(parseTreeXMLDecoder.decode(data), Either.mapLeft(decodeError('ParseTreeXML')(data))),
  //   ).toStrictEqual(Either.left(Error()))
  // })

  it(
    'should toto',
    () => {
      const lolFandomApiPhpUrl = 'https://leagueoflegends.fandom.com/api.php'

      const future = pipe(
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
        Future.chain(a =>
          pipe(a.root.ignore[0], parseXML(includeOnlyXMLDecoder, 'IncludeOnlyXML')),
        ),
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
                    Future.map(html => ({
                      englishName,
                      spell: spell as Spell,
                      html: html.outerHTML,
                    })),
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
              ) as (as: List<ChampSpellHtml>) => Partial<Dict<Spell, string>>,
            ),
          ),
        ),
        task.map(res => {
          // console.log('res =', JSON.stringify(res))
          console.log(
            'res =',
            util.inspect(res, {
              depth: Infinity,
              maxStringLength: Infinity,
              breakLength: Infinity,
            }),
          )
          expectT(2).toStrictEqual(2)
        }),
      )

      return future()
    },
    MsDuration.unwrap(MsDuration.minute(1)),
  )
})

// /^(.*)\s+([IQWER])\s+=\s*\n(.*)$/s
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

type ChampSpellHtml = {
  englishName: string
  spell: Spell
  html: string
}

const listGroupByName = List.groupBy<ChampSpellHtml, string>(c => c.englishName) as (
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
