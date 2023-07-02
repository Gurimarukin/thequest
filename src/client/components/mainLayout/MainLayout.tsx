import { pipe } from 'fp-ts/function'

import { Maybe } from '../../../shared/utils/fp'

import { useHistory } from '../../contexts/HistoryContext'
import { useTranslation } from '../../contexts/TranslationContext'
import { useUser } from '../../contexts/UserContext'
import { Assets } from '../../imgs/Assets'
import { AsyncState } from '../../models/AsyncState'
import type { ChildrenFC } from '../../models/ChildrenFC'
import { appParsers, appRoutes } from '../../router/AppRouter'
import { Link } from '../Link'
import { Loading } from '../Loading'
import { AccountConnected } from './AccountConnected'
import { AccountDisconnected } from './AccountDisconnected'
import { HighlightLink } from './HighlightLink'
import { SearchSummoner } from './SearchSummoner'

export const MainLayout: ChildrenFC = ({ children }) => {
  const { matchLocation } = useHistory()
  const { user } = useUser()
  const { t } = useTranslation('common')

  return (
    <div className="flex h-full flex-col">
      <header className="flex justify-center border-b border-goldenrod bg-gradient-to-br from-zinc-950 to-zinc-900 px-3">
        <div className="relative flex w-full max-w-7xl flex-wrap items-center justify-between py-2">
          <div className="flex shrink-0 items-center gap-6">
            <Link to={appRoutes.index}>
              <img
                src={Assets.yuumi}
                alt="Icône accueil (Yuumi)"
                className="h-12 w-12 rounded-sm bg-black"
              />
            </Link>
            <SearchSummoner />

            <div className="flex items-center gap-4 text-sm">
              {pipe(
                matchLocation(appParsers.anyPlatformSummonerName),
                Maybe.fold(
                  () => null,
                  ({ platform, summonerName }) => (
                    <>
                      <HighlightLink
                        to={appRoutes.platformSummonerName(platform, summonerName, {})}
                        parser={appParsers.platformSummonerName}
                        tooltip={t.layout.championMasteries}
                      >
                        {t.layout.profile}
                      </HighlightLink>
                      <HighlightLink
                        to={appRoutes.platformSummonerNameGame(platform, summonerName)}
                        parser={appParsers.platformSummonerNameGame}
                        tooltip={t.layout.activeGame}
                      >
                        {t.layout.game}
                      </HighlightLink>
                    </>
                  ),
                ),
              )}
            </div>
          </div>

          {pipe(
            user,
            AsyncState.fold(
              () => <Loading className="h-5" />,
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
