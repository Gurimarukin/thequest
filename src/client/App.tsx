import React from 'react'

import { HistoryContextProvider } from './contexts/HistoryContext'
import { StaticDataContextProvider } from './contexts/StaticDataContext'
import { UserContextProvider } from './contexts/UserContext'
import { AppRouterComponent } from './router/AppRouterComponent'

export const App = (): JSX.Element => (
  <HistoryContextProvider>
    <UserContextProvider>
      <StaticDataContextProvider>
        <AppRouterComponent />
      </StaticDataContextProvider>
    </UserContextProvider>
  </HistoryContextProvider>
)
