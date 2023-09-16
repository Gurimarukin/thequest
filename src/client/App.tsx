import { HistoryContextProvider } from './contexts/HistoryContext'
import { StaticDataContextProvider } from './contexts/StaticDataContext'
import { ToasterContextProvider } from './contexts/ToasterContext'
import { TranslationContextProvider } from './contexts/TranslationContext'
import { UserContextProvider } from './contexts/UserContext'
import { AppRouterComponent } from './router/AppRouterComponent'

export const App: React.FC = () => (
  <TranslationContextProvider>
    <ToasterContextProvider>
      <HistoryContextProvider>
        <UserContextProvider>
          <StaticDataContextProvider>
            <AppRouterComponent />
          </StaticDataContextProvider>
        </UserContextProvider>
      </HistoryContextProvider>
    </ToasterContextProvider>
  </TranslationContextProvider>
)
