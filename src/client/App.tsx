import React from 'react'

import { modalLayerId } from './components/Modal'
import { HistoryContextProvider } from './contexts/HistoryContext'
import { StaticDataContextProvider } from './contexts/StaticDataContext'
import { UserContextProvider } from './contexts/UserContext'
import { AppRouterComponent } from './router/AppRouterComponent'

export const App = (): JSX.Element => (
  <div className="relative h-screen w-screen overflow-hidden bg-landing bg-cover font-[lolFont] text-wheat">
    <HistoryContextProvider>
      <UserContextProvider>
        <StaticDataContextProvider>
          <AppRouterComponent />
        </StaticDataContextProvider>
      </UserContextProvider>
    </HistoryContextProvider>
    <div id={modalLayerId} className="absolute top-0" />
  </div>
)
