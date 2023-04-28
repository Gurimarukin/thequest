/* eslint-disable functional/no-expression-statements,
                  functional/no-return-void */
import { predicate } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import { lens } from 'monocle-ts'
import React, { createContext, useCallback, useContext } from 'react'
import useSWR from 'swr'

import { apiRoutes } from '../../shared/ApiRouter'
import { SummonerShort } from '../../shared/models/api/summoner/SummonerShort'
import { UserView } from '../../shared/models/api/user/UserView'
import { Future, List, Maybe, Tuple, toNotUsed } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'

import { apiUserSelfFavoritesDelete, apiUserSelfFavoritesPut } from '../api'
import { constants } from '../config/constants'
import { useLocalStorageState } from '../hooks/useLocalStorageState'
import { futureRunUnsafe } from '../utils/futureRunUnsafe'
import { http, statusesToOption } from '../utils/http'

const recentSearchesCodec = Tuple.of(List.codec(SummonerShort.codec), 'List<SummonerShort>')

type UserContext = {
  refreshUser: () => void
  user: Maybe<UserView>
  addFavoriteSearch: (summoner: SummonerShort, onNotFound: () => void) => void
  removeFavoriteSearch: (summoner: SummonerShort) => void
  recentSearches: List<SummonerShort>
  addRecentSearch: (summoner: SummonerShort) => void
  removeRecentSearch: (summoner: SummonerShort) => void
}

const UserContext = createContext<UserContext | undefined>(undefined)

export const UserContextProvider: React.FC = ({ children }) => {
  const {
    data,
    error,
    mutate: refreshUser,
  } = useSWR(
    apiRoutes.user.self.get,
    ([url, method]) =>
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
    (summoner: SummonerShort, onNotFound: () => void): Maybe<void> =>
      pipe(
        Maybe.fromNullable(data),
        Maybe.flatten,
        Maybe.filter(
          flow(
            UserView.Lens.favoriteSearches.get,
            predicate.not(List.elem(SummonerShort.byPuuidEq)(summoner)),
          ),
        ),
        Maybe.map(oldData => {
          const newData = pipe(
            UserView.Lens.favoriteSearches,
            lens.modify(flow(List.append(summoner), List.sort(SummonerShort.byNameOrd))),
          )(oldData)

          refreshUser(Maybe.some(newData), { revalidate: false })
          // setLoading(true) // TODO
          pipe(
            apiUserSelfFavoritesPut(summoner),
            statusesToOption(404),
            Future.map(
              Maybe.fold(() => {
                refreshUser(Maybe.some(oldData), { revalidate: false })
                onNotFound()
              }, toNotUsed),
            ),
            Future.orElseW(() => {
              refreshUser(Maybe.some(oldData), { revalidate: false })
              alert("Erreur lors de l'ajout du favori") // TODO: toaster
              return Future.notUsed
            }),
            // Future.map(() => setLoading(false)), // TODO
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
          flow(UserView.Lens.favoriteSearches.get, List.elem(SummonerShort.byPuuidEq)(summoner)),
        ),
        Maybe.map(oldData => {
          const newData = pipe(
            UserView.Lens.favoriteSearches,
            lens.modify(List.difference(SummonerShort.byPuuidEq)([summoner])),
          )(oldData)

          refreshUser(Maybe.some(newData), { revalidate: false })
          // setLoading(true) // TODO
          pipe(
            apiUserSelfFavoritesDelete(summoner), // TODO: handle error
            Future.orElseW(() => {
              refreshUser(Maybe.some(oldData), { revalidate: false })
              alert('Erreur lors de la suppression du favori') // TODO: toaster
              return Future.notUsed
            }),
            // Future.map(() => setLoading(false)), // TODO
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
          List.uniq(SummonerShort.byPuuidEq),
          List.takeLeft(constants.recentSearches.maxCount),
        ),
      ),
    [setRecentSearches_],
  )

  const removeRecentSearch = useCallback(
    (summoner: SummonerShort) =>
      setRecentSearches_(List.difference(SummonerShort.byPuuidEq)([summoner])),
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
    recentSearches_,
    List.difference(SummonerShort.byPuuidEq)(
      pipe(
        user,
        List.fromOption,
        List.chain(u =>
          pipe(u.favoriteSearches, List.concat(List.fromOption(u.linkedRiotAccount))),
        ),
      ),
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
    // eslint-disable-next-line functional/no-throw-statements
    throw Error('useUser must be used within a UserContextProvider')
  }
  return context
}
