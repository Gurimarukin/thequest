/* eslint-disable functional/no-expression-statement,
                  functional/no-return-void */
import { predicate } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import { lens } from 'monocle-ts'
import React, { createContext, useCallback, useContext } from 'react'
import useSWR from 'swr'

import { apiRoutes } from '../../shared/ApiRouter'
import { SummonerShort } from '../../shared/models/api/summoner/SummonerShort'
import { UserView } from '../../shared/models/api/user/UserView'
import { Future, List, Maybe, Tuple } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'

import { apiUserSelfFavoritesDelete, apiUserSelfFavoritesPut } from '../api'
import { constants } from '../config/constants'
import { useLocalStorageState } from '../hooks/useLocalStorageState'
import { futureRunUnsafe } from '../utils/futureRunUnsafe'
import { http, statusesToOption } from '../utils/http'

const recentSearchesCodec = Tuple.of(List.codec(SummonerShort.codec), 'List<SummonerShort>')

type UserContext = {
  readonly refreshUser: () => void
  readonly user: Maybe<UserView>
  readonly addFavoriteSearch: (summoner: SummonerShort) => void
  readonly removeFavoriteSearch: (summoner: SummonerShort) => void
  readonly recentSearches: List<SummonerShort>
  readonly addRecentSearch: (summoner: SummonerShort) => void
  readonly removeRecentSearch: (summoner: SummonerShort) => void
}

const UserContext = createContext<UserContext | undefined>(undefined)

export const UserContextProvider: React.FC = ({ children }) => {
  const {
    data,
    error,
    mutate: refreshUser,
  } = useSWR(
    apiRoutes.user.self.get,
    (url, method) =>
      pipe(
        http([url, method], { retry: 0 }, [UserView.codec, 'UserView']),
        statusesToOption(401, 404), // no token or user not found
        futureMaybe.map(
          pipe(UserView.Lens.favoriteSearches, lens.modify(List.sort(SummonerShort.byNameOrd))),
        ),
        futureRunUnsafe,
      ),
    { revalidateOnFocus: false },
  )

  const addFavoriteSearch = useCallback(
    (summoner: SummonerShort): Maybe<void> =>
      pipe(
        Maybe.fromNullable(data),
        Maybe.flatten,
        Maybe.filter(
          flow(
            UserView.Lens.favoriteSearches.get,
            predicate.not(List.elem(SummonerShort.byPlatformAndNameEq)(summoner)),
          ),
        ),
        Maybe.map(
          pipe(
            UserView.Lens.favoriteSearches,
            lens.modify(flow(List.append(summoner), List.sort(SummonerShort.byNameOrd))),
          ),
        ),
        Maybe.map(newData => {
          refreshUser(Maybe.some(newData), { revalidate: false })
          pipe(
            apiUserSelfFavoritesPut(summoner),
            Future.map(() => refreshUser()),
            futureRunUnsafe,
          )
        }),
      ),
    [data, refreshUser],
  )

  const removeFavoriteSearch = useCallback(
    (summoner: SummonerShort): Maybe<void> =>
      pipe(
        Maybe.fromNullable(data),
        Maybe.flatten,
        Maybe.filter(
          flow(
            UserView.Lens.favoriteSearches.get,
            List.elem(SummonerShort.byPlatformAndNameEq)(summoner),
          ),
        ),
        Maybe.map(
          pipe(
            UserView.Lens.favoriteSearches,
            lens.modify(List.filter(s => !SummonerShort.byPlatformAndNameEq.equals(s, summoner))),
          ),
        ),
        Maybe.map(newData => {
          refreshUser(Maybe.some(newData), { revalidate: false })
          pipe(
            apiUserSelfFavoritesDelete(summoner),
            Future.map(() => refreshUser()),
            futureRunUnsafe,
          )
        }),
      ),
    [data, refreshUser],
  )

  const [recentSearches_, setRecentSearches_] = useLocalStorageState(
    constants.recentSearches.localStorageKey,
    recentSearchesCodec,
    List.empty,
  )
  const addRecentSearch = useCallback(
    (summoner: SummonerShort) =>
      setRecentSearches_(
        flow(
          List.prepend(summoner),
          List.uniq(SummonerShort.byPlatformAndNameEq),
          List.takeLeft(constants.recentSearches.maxCount),
        ),
      ),
    [setRecentSearches_],
  )
  const removeRecentSearch = useCallback(
    (summoner: SummonerShort) =>
      setRecentSearches_(List.filter(s => !SummonerShort.byPlatformAndNameEq.equals(s, summoner))),
    [setRecentSearches_],
  )

  if (error !== undefined) {
    return (
      <div className="flex justify-center">
        <pre className="mt-4">error</pre>
      </div>
    )
  }

  const user = pipe(Maybe.fromNullable(data), Maybe.flatten)
  const recentSearches = pipe(
    user,
    Maybe.fold(
      () => recentSearches_,
      ({ favoriteSearches }) =>
        pipe(recentSearches_, List.difference(SummonerShort.byPlatformAndNameEq)(favoriteSearches)),
    ),
  )

  const value: UserContext = {
    refreshUser: () => refreshUser(),
    user,
    addFavoriteSearch,
    removeFavoriteSearch,
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export const useUser = (): UserContext => {
  const context = useContext(UserContext)
  if (context === undefined) {
    // eslint-disable-next-line functional/no-throw-statement
    throw Error('useUser must be used within a UserContextProvider')
  }
  return context
}
