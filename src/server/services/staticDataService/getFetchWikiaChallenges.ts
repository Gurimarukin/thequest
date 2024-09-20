import { apply } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'

import { ValidatedNea } from '../../../shared/models/ValidatedNea'
import type { Tuple3 } from '../../../shared/utils/fp'
import { Either, Future, List, NonEmptyArray, Try } from '../../../shared/utils/fp'
import { decodeErrorString } from '../../../shared/utils/ioTsUtils'

import { constants } from '../../config/constants'
import { DomHandler } from '../../helpers/DomHandler'
import type { HttpClient } from '../../helpers/HttpClient'
import { ChampionEnglishName } from '../../models/wikia/ChampionEnglishName'
import type { WikiaChallenge } from '../../models/wikia/WikiaChallenge'
import { WikiaChampionFaction } from '../../models/wikia/WikiaChampionFaction'

// pageid: 1522274
const challengesUrl = `${constants.lolWikiaDomain}/wiki/Challenges_(League_of_Legends)`

export const getFetchWikiaChallenges = (httpClient: HttpClient): Future<List<WikiaChallenge>> =>
  pipe(httpClient.text([challengesUrl, 'get']), Future.chainEitherK(wikiaChallengesFromHtml))

const dataHash = 'data-hash'
const factionChallenges = 'Faction_Challenges'

// export for testing purpose
export const wikiaChallengesFromHtml = (html: string): Try<List<WikiaChallenge>> =>
  pipe(
    html,
    DomHandler.of({ url: challengesUrl }),
    Try.bindTo('domHandler'),
    Try.bind('tabsUl', ({ domHandler }) =>
      pipe(
        domHandler.window.document.body,
        DomHandler.querySelectorEnsureOne(`[${dataHash}="${factionChallenges}"]`),
        Either.mapLeft(withUrlError),
        Try.chainNullableK(withUrlError('tabs <ul> is null'))(
          factionChallengesLi => factionChallengesLi.parentNode,
        ),
      ),
    ),
    Try.bind('tabIndex', ({ tabsUl }) =>
      pipe(
        Array.from(tabsUl.children),
        List.findIndex(e => e.getAttribute(dataHash) === factionChallenges),
        Try.fromOption(() =>
          withUrlError(`can't find <li> with ${dataHash} "${factionChallenges}"`),
        ),
      ),
    ),
    Try.chain(({ domHandler, tabsUl, tabIndex }) =>
      pipe(
        tabsUl.parentNode,
        Try.fromNullable(withUrlError('tabs <ul> parent is null')),
        Try.chainNullableK(withUrlError('tabs <ul> parent parent is null'))(p => p.parentNode),
        Try.chain(
          flow(
            DomHandler.querySelectorEnsureOne(
              `:scope > .wds-tab__content:nth-of-type(${tabIndex + 2})`,
            ),
            Either.mapLeft(withUrlError),
          ),
        ),
        Try.chain(content =>
          pipe(
            Array.from(content.children),
            List.filter(e => !(e.nodeName === 'P' && e.classList.contains('mw-empty-elt'))),
            List.chunksOf(3),
            List.traverseWithIndex(ValidatedNea.getValidation<string>())(
              parseChallenge(domHandler),
            ),
            Either.mapLeft(withUrlErrors),
          ),
        ),
      ),
    ),
  )

const championSelector = 'ul > li > span > span:last-of-type > a'

const parseChallenge =
  (domHandler: DomHandler) =>
  (i: number, tuple: List<Element>): ValidatedNea<string, WikiaChallenge> => {
    if (!isTuple3(tuple)) {
      return pipe(
        tuple,
        List.map(e => e.outerHTML),
        List.mkString(`tuple don't have 3 elements${List.isNonEmpty(tuple) ? '\n' : ''}`, '\n', ''),
        NonEmptyArray.of,
        ValidatedNea.invalid,
      )
    }

    const [dl, p, div] = tuple
    return pipe(
      apply.sequenceS(ValidatedNea.getValidation<string>())({
        title: pipe(
          dl,
          domHandler.querySelectorEnsureOneTextContent('dt'),
          ValidatedNea.fromEither,
        ),
        position: pipe(
          p,
          domHandler.querySelectorEnsureOneTextContent('i > span > span > a'),
          ValidatedNea.fromEither,
          ValidatedNea.chainEitherK(u =>
            pipe(
              WikiaChampionFaction.decoder.decode(u),
              Either.mapLeft(decodeErrorString('WikiaChampionFaction')(u)),
            ),
          ),
        ),
        champions: pipe(
          div,
          DomHandler.querySelectorAllNonEmpty(championSelector),
          ValidatedNea.chain(
            NonEmptyArray.traverse(ValidatedNea.getValidation<string>())(
              flow(
                DomHandler.textContent(championSelector),
                ValidatedNea.fromEither,
                Either.map(ChampionEnglishName),
              ),
            ),
          ),
        ),
      }),
      Either.mapLeft(
        flow(
          List.map(e => `  - ${e}`),
          List.mkString(`- parseChallenge ${i}:\n`, '\n', ''),
          NonEmptyArray.of,
        ),
      ),
    )
  }

const isTuple3 = (tuple: List<Element>): tuple is Tuple3<Element, Element, Element> =>
  tuple.length === 3

const withUrlError = (e: string): Error => Error(`[${challengesUrl}] ${e}`)

const withUrlErrors: (e: NonEmptyArray<string>) => Error = flow(
  List.mkString('\n', '\n', ''),
  withUrlError,
)
