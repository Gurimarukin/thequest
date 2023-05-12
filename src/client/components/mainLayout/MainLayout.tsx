import { pipe } from 'fp-ts/function'
import { useRef } from 'react'

import { Maybe } from '../../../shared/utils/fp'

import { useHistory } from '../../contexts/HistoryContext'
import { useUser } from '../../contexts/UserContext'
import { Assets } from '../../imgs/Assets'
import { PersonFilled } from '../../imgs/svgIcons'
import { AsyncState } from '../../models/AsyncState'
import type { ChildrenFC } from '../../models/ChildrenFC'
import { MasteriesQuery } from '../../models/masteriesQuery/MasteriesQuery'
import { appParsers, appRoutes } from '../../router/AppRouter'
import { cssClasses } from '../../utils/cssClasses'
import { Link } from '../Link'
import { Loading } from '../Loading'
import { Tooltip } from '../tooltip/Tooltip'
import { AccountConnected } from './AccountConnected'
import { AccountDisconnected } from './AccountDisconnected'
import { SearchSummoner } from './SearchSummoner'

export const MainLayout: ChildrenFC = ({ children }) => {
  const { matchesLocation, masteriesQuery } = useHistory()
  const { user, maybeUser } = useUser()

  const selfRef = useRef<HTMLAnchorElement>(null)

  return (
    <div className="flex h-full flex-col">
      <header className="flex justify-center border-b border-goldenrod bg-gradient-to-br from-zinc-950 to-zinc-900">
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
            {pipe(
              maybeUser,
              Maybe.chain(u => u.linkedRiotAccount),
              Maybe.fold(
                () => null,
                ({ platform, puuid, name }) => (
                  <>
                    <Link
                      ref={selfRef}
                      to={appRoutes.sPlatformPuuid(
                        platform,
                        puuid,
                        matchesLocation(appParsers.platformSummonerName)
                          ? MasteriesQuery.toPartial({ ...masteriesQuery, search: Maybe.none })
                          : {},
                      )}
                      className="-mr-1 flex"
                    >
                      <PersonFilled className="h-5" />
                    </Link>
                    <Tooltip hoverRef={selfRef}>
                      {name} — {platform}
                    </Tooltip>
                  </>
                ),
              ),
            )}
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
            AsyncState.fold(
              () => <Loading className="h-6" />,
              () => <AccountDisconnected />,
              Maybe.fold(
                () => <AccountDisconnected />,
                u => <AccountConnected user={u} />,
              ),
            ),
          )}
        </div>
      </header>
      <main className="grow overflow-auto">{children}</main>
    </div>
  )
}
