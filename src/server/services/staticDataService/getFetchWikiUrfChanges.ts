import type { Future } from '../../../shared/utils/fp'

import type { HttpClient } from '../../helpers/HttpClient'
import type { WikiMapChanges } from '../../models/wiki/WikiMapChanges'
import { getFetchWikiAramChanges } from './getFetchWikiAramChanges'

export function getFetchWikiUrfChanges(httpClient: HttpClient): Future<WikiMapChanges> {
  return getFetchWikiAramChanges(httpClient) // TODO
}
