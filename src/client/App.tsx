import React from 'react'

import { HistoryContextProvider } from './contexts/HistoryContext'
import { StaticDataContextProvider } from './contexts/StaticDataContext'
import { AppRouterComponent } from './router/AppRouterComponent'

export const App = (): JSX.Element => (
  <div className="bg-landing bg-cover text-[wheat] h-[100vh] w-[100vw] overflow-hidden font-[lolFont]">
    <StaticDataContextProvider>
      <HistoryContextProvider>
        <AppRouterComponent />
      </HistoryContextProvider>
    </StaticDataContextProvider>
  </div>
)
