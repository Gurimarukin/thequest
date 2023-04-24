/* eslint-disable functional/no-return-void */
import type { Parser } from 'fp-ts-routing'
import { Route, parse } from 'fp-ts-routing'
import { pipe } from 'fp-ts/function'
import * as history from 'history'
import qs from 'qs'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { Either } from '../../shared/utils/fp'

import { AramQuery } from '../models/aramQuery/AramQuery'
import { PartialAramQuery } from '../models/aramQuery/PartialAramQuery'
import { MasteriesQuery } from '../models/masteriesQuery/MasteriesQuery'
import { PartialMasteriesQuery } from '../models/masteriesQuery/PartialMasteriesQuery'

type NavigateOptions = {
  /**
   * @default false
   */
  replace?: boolean
}

type HistoryContext = {
  location: history.Location
  navigate: (to: string, options?: NavigateOptions) => void
  query: qs.ParsedQs
  matchesLocation: <A>(parser: Parser<A>) => boolean

  masteriesQuery: MasteriesQuery
  updateMasteriesQuery: (f: (q: MasteriesQuery) => MasteriesQuery) => void

  aramQuery: AramQuery
  updateAramQuery: (f: (q: AramQuery) => AramQuery) => void
}

const HistoryContext = createContext<HistoryContext | undefined>(undefined)

export const HistoryContextProvider: React.FC = ({ children }) => {
  const h = useMemo(() => history.createBrowserHistory(), [])

  const [location, setLocation] = useState(h.location)
  useEffect(() => h.listen(l => setLocation(l.location)), [h])

  const navigate = useCallback(
    (to: string, { replace = false }: NavigateOptions = {}) =>
      (replace ? h.replace : h.push)({ pathname: to, search: '', hash: '' }),
    [h],
  )

  const query = useMemo(() => qs.parse(location.search.slice(1)), [location.search])

  const matchesLocation = useCallback(
    function <A>(parser: Parser<A>) {
      return parse(
        parser.map(() => true),
        Route.parse(location.pathname),
        false,
      )
    },
    [location.pathname],
  )

  const masteriesQuery = useMemo(
    () =>
      pipe(
        PartialMasteriesQuery.decoder.decode(query),
        Either.getOrElse(() => ({})),
        MasteriesQuery.fromPartial,
      ),
    [query],
  )

  const updateMasteriesQuery = useCallback(
    (f: (q: MasteriesQuery) => MasteriesQuery) =>
      h.push({
        search: pipe(
          f(masteriesQuery),
          MasteriesQuery.toPartial,
          PartialMasteriesQuery.qsStringify,
        ),
      }),
    [h, masteriesQuery],
  )

  const aramQuery = useMemo(
    () =>
      pipe(
        PartialAramQuery.decoder.decode(query),
        Either.getOrElse(() => ({})),
        MasteriesQuery.fromPartial,
      ),
    [query],
  )

  const updateAramQuery = useCallback(
    (f: (q: AramQuery) => AramQuery) =>
      h.push({ search: pipe(f(aramQuery), AramQuery.toPartial, PartialAramQuery.qsStringify) }),
    [aramQuery, h],
  )

  const value: HistoryContext = {
    location,
    navigate,
    query,
    matchesLocation,
    masteriesQuery,
    updateMasteriesQuery,
    aramQuery,
    updateAramQuery,
  }

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>
}

export const useHistory = (): HistoryContext => {
  const context = useContext(HistoryContext)
  if (context === undefined) {
    // eslint-disable-next-line functional/no-throw-statements
    throw Error('useHistory must be used within a HistoryContextProvider')
  }
  return context
}
