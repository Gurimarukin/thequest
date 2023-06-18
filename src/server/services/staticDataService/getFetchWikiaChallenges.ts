import { apply } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'

import { ValidatedNea } from '../../../shared/models/ValidatedNea'
import { ListUtils } from '../../../shared/utils/ListUtils'
import type { Tuple3 } from '../../../shared/utils/fp'
import { Either, Future, List, Maybe, NonEmptyArray, Try } from '../../../shared/utils/fp'
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

// export for testing purpose
export const wikiaChallengesFromHtml = (html: string): Try<List<WikiaChallenge>> =>
  pipe(
    html,
    DomHandler.of({ url: challengesUrl }),
    Try.chain(domHandler =>
      pipe(
        domHandler.window.document.body,
        DomHandler.querySelectorEnsureOne('#Faction-specific_challenges'),
        Either.mapLeft(withUrlError),
        Try.chainOptionK(() => withUrlError('factionChallengesH3 null'))(factionChallengesSpan =>
          Maybe.fromNullable(factionChallengesSpan.parentNode),
        ),
        Try.bindTo('factionChallengesH3'),
        Try.bind('challengesContainer', ({ factionChallengesH3 }) =>
          Try.fromNullable(withUrlError('challengesContainer null'))(
            factionChallengesH3.parentNode,
          ),
        ),
        Try.chainOptionK(() => withUrlError('factionChallengesContent null'))(
          ({ factionChallengesH3, challengesContainer }) =>
            pipe(
              [...challengesContainer.children],
              ListUtils.findFirstWithPrevious(prev =>
                pipe(
                  prev,
                  Maybe.exists(e => e === factionChallengesH3),
                ),
              ),
            ),
        ),
        Try.chain(
          flow(
            DomHandler.querySelectorEnsureOne(':scope > .wds-tab__content:not(.wds-is-current)'),
            Either.mapLeft(withUrlError),
          ),
        ),
        Try.chain(content =>
          pipe(
            [...content.children],
            List.filter(e => !(e.nodeName === 'P' && e.classList.contains('mw-empty-elt'))),
            List.chunksOf(3),
            List.traverseWithIndex(ValidatedNea.getValidation<string>())(
              parseChallenge(domHandler),
            ),
            Either.mapLeft(flow(List.mkString('\n', '\n', ''), withUrlError)),
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
        postion: pipe(
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
                Either.map(ChampionEnglishName.wrap),
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
