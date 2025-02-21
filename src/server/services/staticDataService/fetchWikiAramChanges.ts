import type { Future } from '../../../shared/utils/fp'

import type { HttpClient } from '../../helpers/HttpClient'
import type { WikiMapChanges } from '../../models/wiki/WikiMapChanges'
import { fetFetchMapChanges } from './getFetchMapChanges'

// 'Template:Map changes/data/aram'
export const fetchWikiAramChanges: (httpClient: HttpClient) => Future<WikiMapChanges> =
  fetFetchMapChanges(1399551, 2)
