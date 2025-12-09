import { apply } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import * as D from 'io-ts/Decoder'

import { ValidatedNea } from '../../../shared/models/ValidatedNea'
import { Ability } from '../../../shared/models/api/Ability'
import { StringUtils } from '../../../shared/utils/StringUtils'
import {
  Either,
  Future,
  IO,
  List,
  Maybe,
  NonEmptyArray,
  Try,
  Tuple,
} from '../../../shared/utils/fp'

import { constants } from '../../config/constants'
import { DomHandler } from '../../helpers/DomHandler'
import type { HttpClient } from '../../helpers/HttpClient'
import { ChampionEnglishName } from '../../models/wiki/ChampionEnglishName'
import type { WikiMapChangeAbilities, WikiMapChanges } from '../../models/wiki/WikiMapChanges'
import { chunksMapArray } from '../../utils/chunksMapArray'

const apiPhpUrl = `${constants.lolWikiDomain}/api.php`

type WikiMap = 'aram' | 'urf'

export function fetchWikiMapChanges(httpClient: HttpClient, map: WikiMap): Future<WikiMapChanges> {
  return pipe(
    httpClient.json(
      [apiPhpUrl, 'get'],
      {
        searchParams: {
          action: 'parse',
          format: 'json',
          contentmodel: 'wikitext',
          text: `{{map changes|table|${map}}}`,
        },
      },
      [parseTextDecoder, 'ParseText'],
    ),
    Future.chainIOEitherK(parseHtml),
  )
}

type ParseText = D.TypeOf<typeof parseTextDecoder>

const parseTextDecoder = D.struct({
  parse: D.struct({
    text: D.struct({
      '*': D.string,
    }),
  }),
})

function parseHtml(res: ParseText): IO<WikiMapChanges> {
  return pipe(
    DomHandler.of()(res.parse.text['*']),
    Either.map(domHandler => ({
      domHandler,
      body: domHandler.window.document.body,
    })),
    IO.fromEither,
    IO.chainFirst(({ body }) => preProcessHtml(body)),
    IO.chainEitherK(({ domHandler, body }) =>
      pipe(
        parseBody(domHandler, body),
        Either.mapLeft(flow(List.mkString(`- `, '\n- ', ''), Error)),
      ),
    ),
  )
}

// /en-us/images/thumb/Akshan_Going_Rogue.png/20px-Akshan_Going_Rogue.png?0893d
const imageRegexWithSize = /^(.*\.png)\/\d+px(.*\.png).*$/
const imageRegex = /^(.*\.png).*$/

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

function parseBody(
  domHandler: DomHandler,
  body: HTMLElement,
): ValidatedNea<string, WikiMapChanges> {
  return pipe(
    body,
    DomHandler.querySelectorEnsureOne('div.tabbertab[data-title="Champions"]'),
    ValidatedNea.fromEither,
    ValidatedNea.chain(DomHandler.querySelectorAllNonEmpty(':scope > table > tbody > tr')),
    ValidatedNea.chain(
      flow(
        NonEmptyArray.tail, // first tr contains the table headers
        List.traverseWithIndex(validation)(parseTr(domHandler)),
      ),
    ),
    ValidatedNea.map(entries => new Map(List.compact(entries))),
  )
}

const parseTr =
  (domHandler: DomHandler) =>
  (
    index: number,
    tr: Element,
  ): ValidatedNea<string, Maybe<Tuple<ChampionEnglishName, WikiMapChangeAbilities>>> => {
    const td = ':scope > td'
    const expectedTdsCount = 3

    return pipe(
      tr,
      DomHandler.querySelectorAll(td),
      ValidatedNea.chain(tds => {
        const [champion, generalChanges, abilitiesChanges] = tds

        if (
          champion === undefined ||
          generalChanges === undefined ||
          abilitiesChanges === undefined
        ) {
          return ValidatedNea.invalid([
            `Expected ${expectedTdsCount} elements to match selector (got ${tds.length}): ${td}`,
          ])
        }

        if (expectedTdsCount < tds.length) {
          return ValidatedNea.invalid([
            `More than ${expectedTdsCount} elements matches selector: ${td}`,
          ])
        }

        return pipe(
          abilitiesChanges,
          DomHandler.querySelectorAll(firstChild),
          ValidatedNea.chain(children => {
            if (!List.isNonEmpty(children)) {
              return ValidatedNea.valid(Maybe.none)
            }

            return pipe(
              apply.sequenceT(validation)(
                parseChampionName(domHandler, champion),
                parseAbilityChanges(domHandler, children),
              ),
              ValidatedNea.map(Maybe.some),
            )
          }),
        )
      }),
      prefixErrors(`[${index}] `),
    )
  }

function parseChampionName(
  domHandler: DomHandler,
  td: Element,
): ValidatedNea<string, ChampionEnglishName> {
  return pipe(
    td,
    domHandler.querySelectorEnsureOneTextContent(':scope > span > span > a'),
    Either.map(ChampionEnglishName),
    ValidatedNea.fromEither,
  )
}

function parseAbilityChanges(
  domHandler: DomHandler,
  children: NonEmptyArray<Element>,
): ValidatedNea<string, WikiMapChangeAbilities> {
  const pTag = 'P'

  return pipe(
    children,
    chunksMapArray(e => e.tagName === pTag),
    ValidatedNea.fromOption(() => `Elements did't start with a ${pTag}`),
    ValidatedNea.chain(
      List.traverseWithIndex(validation)((index, [p, changes]) =>
        pipe(
          parseAbilityName(domHandler, p),
          ValidatedNea.map(ability =>
            Tuple.of(
              Ability(ability),
              pipe(
                changes,
                List.map(e => e.outerHTML),
                List.mkString(''),
              ),
            ),
          ),
          prefixErrors(`[${index}] `),
        ),
      ),
    ),
    ValidatedNea.map((entries): WikiMapChangeAbilities => new Map(entries)),
  )
}

function parseAbilityName({ window }: DomHandler, p: Element): ValidatedNea<string, string> {
  return pipe(
    p,
    DomHandler.querySelectorEnsureOne(firstChild, window.HTMLElement),
    Either.chain(datasetGet('ability')),
    ValidatedNea.fromEither,
  )
}

const datasetGet =
  (key: string) =>
  (elt: HTMLElement): Either<string, string> => {
    const res = elt.dataset[key]

    return res === undefined ? Either.left(`data-${key} not found`) : Either.right(res)
  }

const validation = ValidatedNea.getValidation<string>()

const firstChild = ':scope > *'

function prefixErrors(prefix: string): <A>(fa: ValidatedNea<string, A>) => ValidatedNea<string, A> {
  return ValidatedNea.mapLeft(NonEmptyArray.map(e => `${prefix}${e}`))
}
