import type { Parser } from 'fp-ts-routing'
import { Route, parse } from 'fp-ts-routing'
import { useMemo } from 'react'

import { useHistory } from '../contexts/HistoryContext'

export function usePathMatch<A>(parser: Parser<A>): A | undefined {
  const { location } = useHistory()

  return useMemo(
    () => parse(parser, Route.parse(location.pathname), undefined),
    [location.pathname, parser],
  )
}
