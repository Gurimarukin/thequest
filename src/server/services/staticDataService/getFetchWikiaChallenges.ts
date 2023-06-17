import { pipe } from 'fp-ts/function'

import { ListUtils } from '../../../shared/utils/ListUtils'
import { Either, Future, Maybe, Try } from '../../../shared/utils/fp'

import { constants } from '../../config/constants'
import { DomHandler } from '../../helpers/DomHandler'
import type { HttpClient } from '../../helpers/HttpClient'

// https://leagueoflegends.fandom.com/wiki/Challenges_(League_of_Legends)
// id: 1522274

const challengesUrl = `${constants.lolWikiaDomain}/wiki/Challenges_(League_of_Legends)`

// const showTabContentsWait = MsDuration.ms(500)

export const getFetchWikiaChallenges = (httpClient: HttpClient): Future<unknown> => {
  const res = pipe(
    httpClient.text([challengesUrl, 'get']),
    Future.chainEitherK(DomHandler.of({ url: challengesUrl })),
    Future.chainEitherK(jsdom =>
      pipe(
        jsdom.window.document.body,
        DomHandler.querySelectorEnsureOne('#Faction-specific_challenges'),
        Either.mapLeft(withUrlError),
      ),
    ),
  )

  return res
}

// export for testing purpose
export const wikiaChallengesFromHtml = (html: string): Try<unknown> => {
  console.log('wikiaChallengesFromHtml')

  const res = pipe(
    html,
    DomHandler.of({ url: challengesUrl }),
    // Try.chainFirst(showTabContents),
    Try.chain(jsdom =>
      pipe(
        jsdom.window.document.body,
        DomHandler.querySelectorEnsureOne('#Faction-specific_challenges'),
        Either.mapLeft(withUrlError),
      ),
    ),
    Try.chainOptionK(() => withUrlError('factionChallengesH3 null'))(factionChallengesSpan =>
      Maybe.fromNullable(factionChallengesSpan.parentElement),
    ),
    Try.bindTo('factionChallengesH3'),
    Try.bind('challengesContainer', ({ factionChallengesH3 }) =>
      Try.fromNullable(withUrlError('challengesContainer null'))(factionChallengesH3.parentElement),
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
    // Try.chain(
    //   flow(
    //     DomHandler.querySelectorEnsureOne(':scope > .wds-tab__content.wds-is-current'),
    //     Either.mapLeft(withUrlError),
    //   ),
    // ),
    // Try.map(content =>
    //   pipe(
    //     [...content.children],
    //     // List.filter(e => e.nodeName !== 'p' || !e.classList.contains('mw-empty-elt')),
    //     List.chunksOf(3),
    //   ),
    // ),
  )

  return res
}

// const showTabContents = (jsdom: JSDOM): Future<NotUsed> =>
//   pipe(
//     jsdom.window.document.body,
//     DomHandler.querySelectorAll('li.wds-tabs__tab[data-hash=Show]', jsdom.window.HTMLElement),
//     Either.mapLeft(flow(List.mkString('\n'), withUrlError)),
//     IO.fromEither,
//     IO.chainIOK(
//       List.traverse(io.Applicative)(
//         (e): io.IO<void> =>
//           () => {
//             console.log('e =', e.outerHTML)
//             return e.click()
//           },
//       ),
//     ),
//     Future.fromIOEither,
//     Future.chain(() => pipe(Future.notUsed, Future.delay(showTabContentsWait))),
//   )

const withUrlError = (e: string): Error => Error(`[${challengesUrl}] ${e}`)
