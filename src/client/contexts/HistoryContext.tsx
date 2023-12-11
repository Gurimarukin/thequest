/* eslint-disable functional/no-expression-statements, 
                  functional/no-return-void */
import { pipe } from 'fp-ts/function'
import * as history from 'history'
import { lens } from 'monocle-ts'
import qs from 'qs'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

import type { SummonerActiveGameView } from '../../shared/models/api/activeGame/SummonerActiveGameView'
import type { SummonerMasteriesView } from '../../shared/models/api/summoner/SummonerMasteriesView'
import { Either, Maybe } from '../../shared/utils/fp'

import type { ChildrenFC } from '../models/ChildrenFC'
import { GenericQuery } from '../models/genericQuery/GenericQuery'
import { PartialGenericQuery } from '../models/genericQuery/PartialGenericQuery'
import { MasteriesQuery } from '../models/masteriesQuery/MasteriesQuery'
import { PartialMasteriesQuery } from '../models/masteriesQuery/PartialMasteriesQuery'

type HistoryContext = {
  historyStateRef: React.MutableRefObject<HistoryState>
  modifyHistoryStateRef: (f: (prev: HistoryState) => HistoryState) => void

  location: history.Location
  navigate: (to: string, options?: NavigateOptions) => void
  query: qs.ParsedQs

  masteriesQuery: MasteriesQuery
  updateMasteriesQuery: (f: (q: MasteriesQuery) => MasteriesQuery) => void

  genericQuery: GenericQuery
  updateGenericQuery: (f: (q: GenericQuery) => GenericQuery) => void
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

  const masteriesQuery = useMemo(
    (): MasteriesQuery =>
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

  const genericQuery = useMemo(
    (): GenericQuery =>
      pipe(
        PartialGenericQuery.decoder.decode(query),
        Either.getOrElse(() => ({})),
        GenericQuery.fromPartial,
      ),
    [query],
  )

  const updateGenericQuery = useCallback(
    (f: (q: GenericQuery) => GenericQuery) =>
      h.replace({
        search: pipe(f(genericQuery), GenericQuery.toPartial, PartialGenericQuery.qsStringify),
      }),
    [genericQuery, h],
  )

  const value: HistoryContext = {
    historyStateRef,
    modifyHistoryStateRef,
    location,
    navigate,
    query,
    masteriesQuery,
    updateMasteriesQuery,
    genericQuery,
    updateGenericQuery,
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
  masteries: Maybe<SummonerMasteriesView>
  game: Maybe<SummonerActiveGameView>
}

const empty: HistoryState = {
  masteries: Maybe.none,
  game: Maybe.none,
}

const HistoryState = {
  empty,
  Lens: {
    masteries: pipe(lens.id<HistoryState>(), lens.prop('masteries')),
    game: pipe(lens.id<HistoryState>(), lens.prop('game')),
  },
}

export { HistoryState }
