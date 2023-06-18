import { pipe } from 'fp-ts/function'

import type { Try } from '../../../../src/shared/utils/fp'
import { Either, Future } from '../../../../src/shared/utils/fp'

import { Dir } from '../../../../src/server/models/FileOrDir'
import { wikiaChampionsDataFromHtml } from '../../../../src/server/services/staticDataService/getFetchWikiaChampionsData'
import { FsUtils } from '../../../../src/server/utils/FsUtils'

import { Logger } from '../../../Logger'
import { expectT } from '../../../expectT'

const challengesHtml = pipe(Dir.of(__dirname), Dir.joinFile('championsData.html'))

describe('wikiaChampionsDataFromHtml', () => {
  it('should wikia champion data from HTML', () =>
    pipe(
      FsUtils.readFile(challengesHtml),
      Future.chainIOEitherK(wikiaChampionsDataFromHtml(Logger('wikiaChampionsDataFromHtml'))),
    )().then((res: Try<unknown>) => {
      expectT(res).toStrictEqual(Either.right(null))
    }))
})
