import type { Future } from '../../../shared/utils/fp'

import type { HttpClient } from '../../helpers/HttpClient'
import type { WikiMapChanges } from '../../models/wiki/WikiMapChanges'
import { fetFetchMapChanges } from './getFetchMapChanges'

// 'Template:Map changes/data/urf'
export const fetchWikiUrfChanges: (httpClient: HttpClient) => Future<WikiMapChanges> =
  fetFetchMapChanges(1444020, 2)
