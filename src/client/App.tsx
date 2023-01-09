import React from 'react'

import { HistoryContextProvider } from './contexts/HistoryContext'
import { StaticDataContextProvider } from './contexts/StaticDataContext'
import { UserContextProvider } from './contexts/UserContext'
import { AppRouterComponent } from './router/AppRouterComponent'

export const App = (): JSX.Element => (
  <div className="h-[100vh] w-[100vw] overflow-hidden bg-landing bg-cover font-[lolFont] text-wheat">
    <HistoryContextProvider>
      <UserContextProvider>
        <StaticDataContextProvider>
          <AppRouterComponent />
        </StaticDataContextProvider>
      </UserContextProvider>
    </HistoryContextProvider>
  </div>
)
