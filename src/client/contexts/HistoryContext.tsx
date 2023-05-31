/* eslint-disable functional/no-expression-statements, 
                  functional/no-return-void */
import type { Parser } from 'fp-ts-routing'
import { Route, parse } from 'fp-ts-routing'
import { pipe } from 'fp-ts/function'
import * as history from 'history'
import { lens } from 'monocle-ts'
import qs from 'qs'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

import type { SummonerMasteriesView } from '../../shared/models/api/summoner/SummonerMasteriesView'
import { Either, Maybe } from '../../shared/utils/fp'

import type { ChildrenFC } from '../models/ChildrenFC'
import { AramQuery } from '../models/aramQuery/AramQuery'
import { PartialAramQuery } from '../models/aramQuery/PartialAramQuery'
import { MasteriesQuery } from '../models/masteriesQuery/MasteriesQuery'
import { PartialMasteriesQuery } from '../models/masteriesQuery/PartialMasteriesQuery'

type HistoryContext = {
  historyStateRef: React.MutableRefObject<HistoryState>
  modifyHistoryStateRef: (f: (prev: HistoryState) => HistoryState) => void

  location: history.Location
  navigate: (to: string, options?: NavigateOptions) => void
  query: qs.ParsedQs
  matchLocation: <A>(parser: Parser<A>) => Maybe<A>

  masteriesQuery: MasteriesQuery
  updateMasteriesQuery: (f: (q: MasteriesQuery) => MasteriesQuery) => void

  aramQuery: AramQuery
  updateAramQuery: (f: (q: AramQuery) => AramQuery) => void
}

export type NavigateOptions = {
  /**
   * @default false
   */
  replace?: boolean
}

const HistoryContext = createContext<HistoryContext | undefined>(undefined)

export const HistoryContextProvider: ChildrenFC = ({ children }) => {
  const historyStateRef = useRef<HistoryState>(HistoryState.empty)
  const modifyHistoryStateRef = useCallback((f: (prev: HistoryState) => HistoryState) => {
    // eslint-disable-next-line functional/immutable-data
    historyStateRef.current = f(historyStateRef.current)
  }, [])

  const h = useMemo(() => history.createBrowserHistory(), [])

  const [location, setLocation] = useState(h.location)
  useEffect(() => h.listen(l => setLocation(l.location)), [h])

  const navigate = useCallback(
    (to: string, { replace = false }: NavigateOptions = {}) =>
      (replace ? h.replace : h.push)({ pathname: to, search: '', hash: '' }),
    [h],
  )

  const query = useMemo(() => qs.parse(location.search.slice(1)), [location.search])

  const matchLocation = useCallback(
    function <A>(parser: Parser<A>): Maybe<A> {
      return parse(parser.map(Maybe.some), Route.parse(location.pathname), Maybe.none)
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
    (f: (q: MasteriesQuery) => MasteriesQuery) => {
      const newQuery = f(masteriesQuery)
      return (masteriesQuery.view !== newQuery.view ? h.push : h.replace)({
        search: pipe(newQuery, MasteriesQuery.toPartial, PartialMasteriesQuery.qsStringify),
      })
    },
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
      h.replace({ search: pipe(f(aramQuery), AramQuery.toPartial, PartialAramQuery.qsStringify) }),
    [aramQuery, h],
  )

  const value: HistoryContext = {
    historyStateRef,
    modifyHistoryStateRef,
    location,
    navigate,
    query,
    matchLocation,
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

type HistoryState = {
  summonerMasteries: Maybe<SummonerMasteriesView>
}

const empty: HistoryState = {
  summonerMasteries: Maybe.none,
}

const HistoryState = {
  empty,
  Lens: {
    summonerMasteries: pipe(lens.id<HistoryState>(), lens.prop('summonerMasteries')),
  },
}

export { HistoryState }
