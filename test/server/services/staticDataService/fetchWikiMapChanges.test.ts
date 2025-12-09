import { pipe } from 'fp-ts/function'

import { futureRunUnsafe } from '../../../../src/client/utils/futureRunUnsafe'

import { HttpClient } from '../../../../src/server/helpers/HttpClient'
import { fetchWikiMapChanges } from '../../../../src/server/services/staticDataService/fetchWikiMapChanges'

import { Logger } from '../../Logger'

describe('fetchWikiMapChanges', () => {
  it('should fetch', () => pipe(fetchWikiMapChanges(HttpClient(Logger), 'aram'), futureRunUnsafe))
})
