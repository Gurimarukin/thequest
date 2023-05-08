import { HistoryContextProvider } from './contexts/HistoryContext'
import { StaticDataContextProvider } from './contexts/StaticDataContext'
import { UserContextProvider } from './contexts/UserContext'
import { AppRouterComponent } from './router/AppRouterComponent'

export const App: React.FC = () => (
  <HistoryContextProvider>
    <UserContextProvider>
      <StaticDataContextProvider>
        <AppRouterComponent />
      </StaticDataContextProvider>
    </UserContextProvider>
  </HistoryContextProvider>
)
