/* eslint-disable functional/no-expression-statements,
                  functional/no-return-void */
import { predicate } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import { lens } from 'monocle-ts'
import { createContext, useCallback, useContext, useMemo } from 'react'
import useSWR from 'swr'

import { apiRoutes } from '../../shared/ApiRouter'
import { SummonerShort } from '../../shared/models/api/summoner/SummonerShort'
import { UserView } from '../../shared/models/api/user/UserView'
import { Future, List, Maybe, NotUsed, Tuple } from '../../shared/utils/fp'
import { futureMaybe } from '../../shared/utils/futureMaybe'

import { apiUserSelfFavoritesDelete, apiUserSelfFavoritesPut } from '../api'
import { constants } from '../config/constants'
import { useLocalStorageState } from '../hooks/useLocalStorageState'
import { AsyncState } from '../models/AsyncState'
import type { ChildrenFC } from '../models/ChildrenFC'
import { futureRunUnsafe } from '../utils/futureRunUnsafe'
import { http, statusesToOption } from '../utils/http'
import { useToaster } from './ToasterContext'
import { useTranslation } from './TranslationContext'

const recentSearchesKey = 'recentSearches'

const recentSearchesCodec = Tuple.of(List.codec(SummonerShort.codec), 'List<SummonerShort>')

type UserContext = {
  refreshUser: Future<Maybe<UserView> | undefined>
  user: AsyncState<unknown, Maybe<UserView>>
  maybeUser: Maybe<UserView>
  addFavoriteSearch: (summoner: SummonerShort) => Future<Maybe<NotUsed>>
  removeFavoriteSearch: (summoner: SummonerShort) => Future<NotUsed>
  recentSearches: List<SummonerShort>
  addRecentSearch: (summoner: SummonerShort) => void
  removeRecentSearch: (summoner: SummonerShort) => void
}

const UserContext = createContext<UserContext | undefined>(undefined)

export const UserContextProvider: ChildrenFC = ({ children }) => {
  const { t } = useTranslation('common')
  const { showToaster } = useToaster()

  const { data, error, mutate } = useSWR(
    apiRoutes.user.self.get,
    ([url, method]) =>
      pipe(
        http([url, method], { retry: 0 }, [UserView.codec, 'UserView']),
        statusesToOption(401, 404), // no token or user not found
        futureMaybe.map(
          pipe(UserView.Lens.favoriteSearches, lens.modify(List.sort(SummonerShort.byNameOrd))),
        ),
        Future.orElse(e => {
          console.error(e)
          showToaster('error', t.errors.fetchUserError)
          return Future.failed(e)
        }),
        futureRunUnsafe,
      ),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  )

  const addFavoriteSearch = useCallback(
    (summoner: SummonerShort): Future<Maybe<NotUsed>> =>
      pipe(
        Maybe.fromNullable(data),
        Maybe.flatten,
        Maybe.filter(
          flow(
            UserView.Lens.favoriteSearches.get,
            predicate.not(List.elem(SummonerShort.byPuuidEq)(summoner)),
          ),
        ),
        Maybe.map(oldData =>
          pipe(
            apiUserSelfFavoritesPut(summoner),
            statusesToOption(404),
            futureMaybe.map(() => {
              mutate(
                Maybe.some(
                  pipe(
                    UserView.Lens.favoriteSearches,
                    lens.modify(flow(List.append(summoner), List.sort(SummonerShort.byNameOrd))),
                  )(oldData),
                ),
                { revalidate: false },
              )
              return NotUsed
            }),
          ),
        ),
        Maybe.getOrElse(() => Future.failed(Error('Inconsistent state'))),
        Future.orElse(e => {
          console.error(e)
          showToaster('error', t.errors.addFavoriteError)
          return futureMaybe.some(NotUsed)
        }),
      ),
    [data, mutate, showToaster, t.errors.addFavoriteError],
  )

  const removeFavoriteSearch = useCallback(
    (summoner: SummonerShort): Future<NotUsed> =>
      pipe(
        Maybe.fromNullable(data),
        Maybe.flatten,
        Maybe.filter(
          flow(UserView.Lens.favoriteSearches.get, List.elem(SummonerShort.byPuuidEq)(summoner)),
        ),
        Maybe.map(oldData =>
          pipe(
            apiUserSelfFavoritesDelete(summoner),
            Future.map(() => {
              mutate(
                Maybe.some(
                  pipe(
                    UserView.Lens.favoriteSearches,
                    lens.modify(List.difference(SummonerShort.byPuuidEq)([summoner])),
                  )(oldData),
                ),
                { revalidate: false },
              )
              return NotUsed
            }),
          ),
        ),
        Maybe.getOrElse(() => Future.failed(Error('Inconsistent state'))),
        Future.orElse(e => {
          console.error(e)
          showToaster('error', t.errors.removeFavoriteError)
          return Future.notUsed
        }),
      ),
    [data, mutate, showToaster, t.errors.removeFavoriteError],
  )

  const [recentSearches_, setRecentSearches_] = useLocalStorageState(
    recentSearchesKey,
    recentSearchesCodec,
    [],
  )

  const addRecentSearch = useCallback(
    (summoner: SummonerShort) =>
      setRecentSearches_(
        flow(
          List.prepend(summoner),
          List.uniq(SummonerShort.byPuuidEq),
          List.takeLeft(constants.recentSearchesMaxCount),
        ),
      ),
    [setRecentSearches_],
  )

  const removeRecentSearch = useCallback(
    (summoner: SummonerShort) =>
      setRecentSearches_(List.difference(SummonerShort.byPuuidEq)([summoner])),
    [setRecentSearches_],
  )

  const refreshUser = useMemo(
    (): Future<Maybe<UserView> | undefined> =>
      Future.tryCatch(() => mutate(() => Promise.resolve(undefined))),
    [mutate],
  )

  const user = useMemo(() => AsyncState.fromSWR({ data, error }), [data, error])
  const maybeUser = useMemo(() => pipe(user, AsyncState.toOption, Maybe.flatten), [user])

  const recentSearches = useMemo(
    (): List<SummonerShort> =>
      pipe(
        recentSearches_,
        List.difference(SummonerShort.byPuuidEq)(
          pipe(
            user,
            AsyncState.toOption,
            Maybe.flatten,
            List.fromOption,
            List.chain(u =>
              pipe(u.favoriteSearches, List.concat(List.fromOption(u.linkedRiotAccount))),
            ),
          ),
        ),
      ),
    [recentSearches_, user],
  )

  if (error !== undefined) {
    return (
      <div className="flex justify-center">
        <pre className="mt-4">error</pre>
      </div>
    )
  }

  const value: UserContext = {
    refreshUser,
    user,
    maybeUser,
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
