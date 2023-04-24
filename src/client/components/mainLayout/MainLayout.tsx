import { pipe } from 'fp-ts/function'
import React from 'react'

import { Maybe } from '../../../shared/utils/fp'

import { useHistory } from '../../contexts/HistoryContext'
import { useUser } from '../../contexts/UserContext'
import { Assets } from '../../imgs/Assets'
import { appParsers, appRoutes } from '../../router/AppRouter'
import { cssClasses } from '../../utils/cssClasses'
import { Link } from '../Link'
import { AccountConnected } from './AccountConnected'
import { AccountDisconnected } from './AccountDisconnected'
import { SearchSummoner } from './SearchSummoner'

export const MainLayout: React.FC = ({ children }) => {
  const { matchesLocation } = useHistory()
  const { user } = useUser()

  return (
    <div className="flex h-full flex-col">
      <header className="flex justify-center border-b border-goldenrod bg-zinc-900">
        <div className="relative flex w-full max-w-7xl flex-wrap items-center justify-between px-3 py-2">
          <div className="flex shrink-0 items-center gap-6">
            <Link to={appRoutes.index}>
              <img
                src={Assets.iconYuumi}
                alt="Icône accueil (Yuumi)"
                className="w-12 rounded-sm bg-black"
              />
            </Link>
            <SearchSummoner />
            <Link
              to={appRoutes.aram({})}
              className={cssClasses('text-sm', [
                'border-b border-goldenrod',
                matchesLocation(appParsers.aram),
              ])}
            >
              ARAM
            </Link>
          </div>
          {pipe(
            user,
            Maybe.fold(
              () => <AccountDisconnected />,
              u => <AccountConnected user={u} />,
            ),
          )}
        </div>
      </header>
      <main className="grow overflow-auto">{children}</main>
    </div>
  )
}
