import { pipe } from 'fp-ts/function'

import { Future } from '../../../../src/shared/utils/fp'

import { HttpClient } from '../../../../src/server/helpers/HttpClient'
import { fetchWikiMapChanges } from '../../../../src/server/services/staticDataService/fetchWikiMapChanges'

import { Logger } from '../../Logger'

describe('fetchWikiMapChanges', () => {
  it('should fetch', () => pipe(fetchWikiMapChanges(HttpClient(Logger), 'aram'), Future.runUnsafe))
})
