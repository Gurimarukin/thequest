/* eslint-disable functional/no-return-void */
import { flow, pipe } from 'fp-ts/function'
import { lens } from 'monocle-ts'
import React, { createContext, useCallback, useContext } from 'react'
import useSWR from 'swr'

import { apiRoutes } from '../../shared/ApiRouter'
import { SummonerShort } from '../../shared/models/api/SummonerShort'
import { UserView } from '../../shared/models/api/user/UserView'
import { List, Maybe, Tuple } from '../../shared/utils/fp'

import { constants } from '../config/constants'
import { useLocalStorageState } from '../hooks/useLocalStorageState'
import { futureRunUnsafe } from '../utils/futureRunUnsafe'
import { http, statusesToOption } from '../utils/http'

const recentSearchesCodec = Tuple.of(List.codec(SummonerShort.codec), 'List<SummonerShort>')

type UserContext = {
  readonly refreshUser: () => void
  readonly user: Maybe<UserView>
  readonly addFavoriteSearch: (summoner: SummonerShort) => void
  readonly recentSearches: List<SummonerShort>
  readonly addRecentSearch: (summoner: SummonerShort) => void
}

const UserContext = createContext<UserContext | undefined>(undefined)

export const UserContextProvider: React.FC = ({ children }) => {
  const {
    data,
    error,
    mutate: refreshUser,
  } = useSWR(
    apiRoutes.user.self.get,
    (method, url) =>
      pipe(
        http([method, url], { retry: 0 }, [UserView.codec, 'UserView']),
        statusesToOption(401, 404), // no token or user not found
        futureRunUnsafe,
      ),
    { revalidateOnFocus: false },
  )

  const addFavoriteSearch = useCallback(
    (summoner: SummonerShort) =>
      refreshUser(
        flow(
          Maybe.fromNullable,
          Maybe.flatten,
          Maybe.map(
            pipe(
              UserView.Lens.favoriteSearches,
              lens.modify((summoners: List<SummonerShort>) =>
                pipe(summoners, List.elem(SummonerShort.byPlatformAndNameEq)(summoner))
                  ? summoners
                  : pipe(summoners, List.append(summoner), List.sort(SummonerShort.byNameOrd)),
              ),
            ),
          ),
        ),
        {
          revalidate: false /* TODO: send to server */,
        },
      ),
    [refreshUser],
  )

  const [recentSearches_, setRecentSearches_] = useLocalStorageState(
    constants.recentSearchesLocalStorageKey,
    recentSearchesCodec,
    List.empty,
  )
  const addRecentSearch = useCallback(
    (summoner: SummonerShort) =>
      setRecentSearches_(
        flow(List.prepend(summoner), List.uniq(SummonerShort.byPlatformAndNameEq)),
      ),
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
    recentSearches,
    addRecentSearch,
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
