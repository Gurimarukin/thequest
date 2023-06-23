import { pipe } from 'fp-ts/function'

import type { Try } from '../../../../src/shared/utils/fp'
import { Either, Future } from '../../../../src/shared/utils/fp'

import { Dir } from '../../../../src/server/models/FileOrDir'
import { wikiaChallengesFromHtml } from '../../../../src/server/services/staticDataService/getFetchWikiaChallenges'
import { FsUtils } from '../../../../src/server/utils/FsUtils'

import { expectT } from '../../../expectT'

const challengesHtml = pipe(Dir.of(__dirname), Dir.joinFile('challenges.html'))

describe('wikiaChallengesFromHtml', () => {
  it('should wikia challenges from HTML', () =>
    pipe(FsUtils.readFile(challengesHtml), Future.chainEitherK(wikiaChallengesFromHtml))().then(
      (res: Try<unknown>) => {
        expectT(res).toStrictEqual(Either.right(null))
      },
    ))
})
