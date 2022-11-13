import React from 'react'

import { DDragonContextProvider } from './contexts/DDragonContext'
import { HistoryContextProvider } from './contexts/HistoryContext'
import { AppRouterComponent } from './router/AppRouterComponent'

export const App = (): JSX.Element => (
  <div className="bg-landing bg-cover text-goldenrod h-[100vh] w-[100vw] overflow-hidden font-[lolFont]">
    <DDragonContextProvider>
      <HistoryContextProvider>
        <AppRouterComponent />
      </HistoryContextProvider>
    </DDragonContextProvider>
  </div>
)
