import { apply } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'

import { ValidatedNea } from '../../../shared/models/ValidatedNea'
import type { Tuple3 } from '../../../shared/utils/fp'
import { Either, Future, List, NonEmptyArray, Try } from '../../../shared/utils/fp'
import { decodeErrorString } from '../../../shared/utils/ioTsUtils'

import { constants } from '../../config/constants'
import { DomHandler } from '../../helpers/DomHandler'
import type { HttpClient } from '../../helpers/HttpClient'
import { ChampionEnglishName } from '../../models/wiki/ChampionEnglishName'
import type { WikiChallenge } from '../../models/wiki/WikiChallenge'
import { WikiChampionFaction } from '../../models/wikia/WikiChampionFaction'

// pageid: 1522274
const challengesUrl = `${constants.lolWikiDomain}/en-us/Challenges`

export const getFetchWikiChallenges = (httpClient: HttpClient): Future<List<WikiChallenge>> =>
  pipe(httpClient.text([challengesUrl, 'get']), Future.chainEitherK(wikiChallengesFromHtml))

const dataTitle = 'data-title'
const factionChallengez = 'Faction Challenges'

// export for testing purpose
export const wikiChallengesFromHtml = (html: string): Try<List<WikiChallenge>> =>
  pipe(
    html,
    DomHandler.of({ url: challengesUrl }),
    Try.bindTo('domHandler'),
    Try.bind('content', ({ domHandler }) =>
      pipe(
        domHandler.window.document.body,
        DomHandler.querySelectorEnsureOne(`[${dataTitle}="${factionChallengez}"]`),
        Either.mapLeft(withUrlError),
      ),
    ),
    Try.chain(({ domHandler, content }) =>
      pipe(
        Array.from(content.children),
        List.filter(e => !(e.nodeName === 'P' && e.classList.contains('mw-empty-elt'))),
        List.chunksOf(3),
        List.traverseWithIndex(ValidatedNea.getValidation<string>())(parseChallenge(domHandler)),
        Either.mapLeft(withUrlErrors),
      ),
    ),
  )

const championSelector = 'ul > li > span > span:last-of-type > a'

const parseChallenge =
  (domHandler: DomHandler) =>
  (i: number, tuple: List<Element>): ValidatedNea<string, WikiChallenge> => {
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
        faction: pipe(
          p,
          domHandler.querySelectorEnsureOneTextContent('i > span > span:last-child > a'),
          ValidatedNea.fromEither,
          ValidatedNea.chainEitherK(u =>
            pipe(
              WikiChampionFaction.decoder.decode(u),
              Either.mapLeft(decodeErrorString('WikiaChampionFaction')(u)),
            ),
          ),
        ),
        title: pipe(
          dl,
          domHandler.querySelectorEnsureOneTextContent('dt'),
          ValidatedNea.fromEither,
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
