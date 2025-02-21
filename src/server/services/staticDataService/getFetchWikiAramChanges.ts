import { apply, readonlyMap, string } from 'fp-ts'
import { flow, identity, pipe } from 'fp-ts/function'
import type { Decoder } from 'io-ts/Decoder'
import * as D from 'io-ts/Decoder'
import xml2js from 'xml2js'

import { ValidatedNea } from '../../../shared/models/ValidatedNea'
import type { ChampionSpellHtml } from '../../../shared/models/api/MapChangesData'
import { SpellName } from '../../../shared/models/api/SpellName'
import { ListUtils } from '../../../shared/utils/ListUtils'
import { StringUtils } from '../../../shared/utils/StringUtils'
import type { Tuple3 } from '../../../shared/utils/fp'
import {
  Either,
  Future,
  IO,
  List,
  Maybe,
  NonEmptyArray,
  PartialDict,
  Try,
  Tuple,
} from '../../../shared/utils/fp'
import { decodeError, decodeErrorString } from '../../../shared/utils/ioTsUtils'

import { constants } from '../../config/constants'
import { DomHandler } from '../../helpers/DomHandler'
import type { HttpClient } from '../../helpers/HttpClient'
import { ChampionEnglishName } from '../../models/wiki/ChampionEnglishName'
import type { WikiMapChanges } from '../../models/wiki/WikiMapChanges'

const apiPhpUrl = `${constants.lolWikiDomain}/api.php`

const championsSep = '\n\n'

export function getFetchWikiAramChanges(httpClient: HttpClient): Future<WikiMapChanges> {
  const fetchMapChanges: Future<string> = pipe(
    httpClient.json(
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
    Future.map(a => a.includeonly),
  )

  return pipe(
    fetchMapChanges,
    Future.chainEitherK(parseRawChanges),
    Future.map(flow(groupChangesByChampionsAndSpells, makeTemplate)),
    Future.chain(fetchParseWikiTextChunked),
    Future.chainIOEitherK(parseWikiHtml),
  )

  function fetchParseWikiTextChunked(text: string): Future<string> {
    const champions = text.split(championsSep)

    return pipe(
      champions,
      // splitting in half should be enough, increase if needed
      List.chunksOf(Math.round(champions.length / 2)),
      Future.traverseArrayWithIndex(fetchParseWikiText),
      Future.map(List.mkString('\n')),
    )
  }

  function fetchParseWikiText(index: number, champions: List<string>): Future<string> {
    const text = champions.join(championsSep)

    const maxLength = 5484

    if (text.length > maxLength) {
      return Future.failed(Error(`wikitext length should be less than ${maxLength}`))
    }

    return pipe(
      httpClient.json(
        [apiPhpUrl, 'get'],
        {
          searchParams: {
            action: 'parse',
            format: 'json',
            contentmodel: 'wikitext',
            text,
          },
        },
        [parseTextDecoder, 'ParseText'],
      ),
      Future.map(res => res.parse.text['*']),
    )
  }
}

function groupChangesByChampionsAndSpells(
  tuples: List<Tuple3<ChampionEnglishName, SpellName, string>>,
): ReadonlyMap<ChampionEnglishName, PartialDict<SpellName, string>> {
  return pipe(
    tuples,
    ListUtils.groupByAsMap(ChampionEnglishName.Eq)(([englishName, spell, changes]) =>
      Tuple.of(englishName, Tuple.of(spell, changes)),
    ),
    readonlyMap.map(
      flow(
        List.groupBy(([spell]) => spell),
        PartialDict.map(
          flow(
            List.map(([, changes]) => changes.trim()),
            List.mkString('\n'),
          ),
        ),
      ),
    ),
  )
}

function parseRawChanges(
  changes: string,
): Try<List<Tuple3<ChampionEnglishName, SpellName, string>>> {
  return pipe(
    changes,
    string.split('\n'),
    NonEmptyArray.init,
    List.mkString('\n'),
    string.split('\n|'),
    NonEmptyArray.tail,
    List.filterMap(
      flow(
        StringUtils.matcher3(nameSpellValueRegex),
        Maybe.map(tuple =>
          pipe(
            tupleChampionEnglishNameSpellNameStringDecoder.decode(tuple),
            Either.mapLeft(decodeError('Tuple3<ChampionEnglishName, SpellName, string>')(tuple)),
          ),
        ),
      ),
    ),
    List.sequence(Either.Applicative),
  )
}

function makeTemplate(
  grouped: ReadonlyMap<ChampionEnglishName, PartialDict<SpellName, string>>,
): string {
  return pipe(
    grouped,
    readonlyMap.toReadonlyArray(ChampionEnglishName.Ord),
    List.map(([englishName, spells]) =>
      StringUtils.stripMargins(
        `== ${englishName} ==
        |${pipe(
          SpellName.values,
          List.filterMap(spell =>
            pipe(
              Maybe.fromNullable(spells[spell]),
              Maybe.map(changes =>
                StringUtils.stripMargins(
                  `=== ${spell} ===
                  |{{ai|${spell}|${englishName}}}
                  |${changes}`,
                ),
              ),
            ),
          ),
          List.mkString('\n'),
        )}`,
      ),
    ),
    List.mkString('\n\n'),
  )
}

function parseWikiHtml(html: string): IO<WikiMapChanges> {
  return pipe(
    DomHandler.of()(html),
    Either.map(domHandler => domHandler.window.document.body),
    IO.fromEither,
    IO.chainFirst(preProcessHtml),
    IO.chainEitherK(
      flow(
        DomHandler.querySelectorAllNonEmpty('div.mw-parser-output > #toc ~ *'),
        Either.mapLeft(
          flow(
            List.map(e => `- ${e}`),
            List.mkString('\n'),
            Error,
          ),
        ),
      ),
    ),
    IO.chainEitherK(
      flow(
        parseGroupHtml,
        Either.mapLeft(es => Error(es.join('\n'))),
      ),
    ),
  )
}

function preProcessHtml(body: HTMLElement): IO<void> {
  return () => {
    /* eslint-disable functional/no-expression-statements */
    body.querySelectorAll('script').forEach(e => e.remove())

    body.querySelectorAll('img').forEach(e => {
      const newUrl = pipe(
        e.src,
        StringUtils.matcher2(imageRegexWithSize),
        Maybe.map(([a, b]) => `${a}/40px${b}`),
        Maybe.alt(() => pipe(e.src, StringUtils.matcher1(imageRegex))),
        Maybe.getOrElse(() => e.src),
      )

      e.setAttribute('src', new URL(newUrl, constants.lolWikiDomain).toString())
      e.removeAttribute('srcset')
    })

    body.querySelectorAll('a').forEach(e => {
      e.setAttribute('href', new URL(e.href, constants.lolWikiDomain).toString())
      e.setAttribute('target', '_blank')
      e.setAttribute('rel', 'noreferrer')
    })

    body.querySelectorAll('.inline-image').forEach(e => e.removeAttribute('style'))
    /* eslint-enable functional/no-expression-statements */

    return Try.success(undefined)
  }
}

const validation = ValidatedNea.getValidation<string>()

function parseGroupHtml(elements: ReadonlyArray<Element>): ValidatedNea<string, WikiMapChanges> {
  return pipe(
    elements,
    splitMapArray(e => (e.tagName === 'H2' ? Maybe.some(e) : Maybe.none)),
    ValidatedNea.fromOption(() => "Elements did't start with a H2"),
    ValidatedNea.chain(
      List.traverse(validation)(([h2, elts]) =>
        pipe(
          apply.sequenceT(validation)(
            parseFirstChildTextContent([ChampionEnglishName.codec, 'ChampionEnglishName'])(h2),
            parseH3s(elts),
          ),
        ),
      ),
    ),
    ValidatedNea.map(
      flow(
        ListUtils.groupByAsMap(ChampionEnglishName.Eq)(identity),
        readonlyMap.map(NonEmptyArray.head),
      ),
    ),
  )
}

function parseH3s(
  elements: ReadonlyArray<Element>,
): ValidatedNea<string, PartialDict<SpellName, ChampionSpellHtml>> {
  return pipe(
    elements,
    splitMapArray(e => (e.tagName === 'H3' ? Maybe.some(e) : Maybe.none)),
    ValidatedNea.fromOption(() => "Elements didn't start with a H3"),
    ValidatedNea.chain(
      List.traverse(validation)(([h3, elts]) =>
        pipe(
          apply.sequenceT(validation)(
            parseFirstChildTextContent([SpellName.codec, 'SpellName'])(h3),
            parseSpellHtml(elts),
          ),
        ),
      ),
    ),
    ValidatedNea.map(
      flow(
        List.groupBy(([spell]) => spell),
        PartialDict.map(flow(NonEmptyArray.head, Tuple.snd)),
      ),
    ),
  )
}

const firstChildSelector = ':scope > :first-child'

const parseFirstChildTextContent =
  <A>([decoder, decoderName]: Tuple<Decoder<string, A>, string>) =>
  (elt: Element): ValidatedNea<string, A> =>
    pipe(
      elt,
      DomHandler.querySelectorEnsureOne(firstChildSelector),
      Either.chain(DomHandler.textContent(firstChildSelector)),
      Either.chain(text =>
        pipe(decoder.decode(text), Either.mapLeft(decodeErrorString(decoderName)(text))),
      ),
      Either.mapLeft(NonEmptyArray.of),
    )

function parseSpellHtml(elts: ReadonlyArray<Element>): ValidatedNea<string, ChampionSpellHtml> {
  const [e1, e2, ...tail] = elts

  if (e1 === undefined || e2 === undefined) {
    return ValidatedNea.invalid(NonEmptyArray.of('Spell elements should be length 2 or more'))
  }

  return ValidatedNea.valid({
    spell: e1.outerHTML, // TODO: take first child?
    description: [e2, ...tail].map(e => e.outerHTML).join('\n'),
  })
}

// Akshan Q = \n* Scoundrel duration reduced to 25 seconds.
const nameSpellValueRegex = RegExp(
  `^(.*)\\s+([${SpellName.values.join('')}])\\s+=\\s*\\n(.*)$`,
  's',
)

// /en-us/images/thumb/Akshan_Going_Rogue.png/20px-Akshan_Going_Rogue.png?0893d
const imageRegexWithSize = /^(.*\.png)\/\d+px(.*\.png).*$/
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

const tupleChampionEnglishNameSpellNameStringDecoder = D.tuple(
  ChampionEnglishName.codec,
  SpellName.decoder,
  D.string,
)

const parseTextDecoder = D.struct({
  parse: D.struct({
    text: D.struct({
      '*': D.string,
    }),
  }),
})

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

export const splitMapArray =
  <A, B>(f: (a: A) => Maybe<B>) =>
  (as: ReadonlyArray<A>): Maybe<ReadonlyArray<Tuple<B, ReadonlyArray<A>>>> => {
    if (!List.isNonEmpty(as)) return Maybe.some([])

    const [head, ...tail] = as

    const init = f(head)

    if (Maybe.isNone(init)) return Maybe.none

    /* eslint-disable functional/no-let */
    let b: B = init.value
    let acc: A[] = []
    /* eslint-enable functional/no-let */

    const res: Tuple<B, ReadonlyArray<A>>[] = []

    /* eslint-disable functional/no-expression-statements, functional/immutable-data*/
    tail.forEach(a => {
      const opt = f(a)

      if (Maybe.isSome(opt)) {
        res.push([b, acc])
        b = opt.value
        acc = []
      } else {
        acc.push(a)
      }
    })

    res.push([b, acc])
    /* eslint-enable functional/no-expression-statements, functional/immutable-data */

    return Maybe.some(res)
  }
