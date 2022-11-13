import React from 'react'

import { HistoryContextProvider } from './contexts/HistoryContext'
import { AppRouterComponent } from './router/AppRouterComponent'

export const App = (): JSX.Element => (
  <div className="h-[100vh] w-[100vw] overflow-hidden font-[baloopaaji2]">
    <HistoryContextProvider>
      <AppRouterComponent />
    </HistoryContextProvider>
  </div>
)
