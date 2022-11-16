/* eslint-disable functional/no-return-void */
import { pipe } from 'fp-ts/function'
import React, { createContext, useContext } from 'react'
import useSWR from 'swr'

import { apiRoutes } from '../../shared/ApiRouter'
import { UserView } from '../../shared/models/api/user/UserView'
import { Maybe } from '../../shared/utils/fp'

import { futureRunUnsafe } from '../utils/futureRunUnsafe'
import { http, statusesToOption } from '../utils/http'

type UserContext = {
  readonly refreshUser: () => void
  readonly user: Maybe<UserView>
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

  if (error !== undefined) {
    return (
      <div className="flex justify-center">
        <pre className="mt-4">error</pre>
      </div>
    )
  }

  const value: UserContext = {
    refreshUser: () => refreshUser(),
    user: pipe(Maybe.fromNullable(data), Maybe.flatten),
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
