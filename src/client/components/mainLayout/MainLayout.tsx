import { pipe } from 'fp-ts/function'
import { useRef } from 'react'

import { Maybe } from '../../../shared/utils/fp'

import { useHistory } from '../../contexts/HistoryContext'
import { useTranslation } from '../../contexts/TranslationContext'
import { useUser } from '../../contexts/UserContext'
import { Assets } from '../../imgs/Assets'
import { HowlingAbyssSimple } from '../../imgs/svgs/HowlingAbyss'
import { AsyncState } from '../../models/AsyncState'
import type { ChildrenFC } from '../../models/ChildrenFC'
import { appParsers, appRoutes } from '../../router/AppRouter'
import { Link } from '../Link'
import { Loading } from '../Loading'
import { MaskedImage } from '../MaskedImage'
import { Tooltip } from '../tooltip/Tooltip'
import { AccountConnected } from './AccountConnected'
import { AccountDisconnected } from './AccountDisconnected'
import { HighlightLink } from './HighlightLink'
import { Languages } from './Languages'
import { SearchSummoner } from './SearchSummoner'

export const MainLayout: ChildrenFC = ({ children }) => {
  const { matchLocation } = useHistory()
  const { user } = useUser()
  const { t } = useTranslation('common')

  const homeRef = useRef<HTMLAnchorElement>(null)

  return (
    <div className="flex h-full flex-col">
      <header className="flex justify-center border-b border-goldenrod bg-gradient-to-br from-zinc-950 to-zinc-900 px-3">
        <div className="relative flex w-full max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <Link ref={homeRef} to={appRoutes.index} className="py-2">
              <img
                src={Assets.yuumi}
                alt={t.layout.yuumiIconAlt}
                className="h-12 w-12 rounded-sm bg-black text-2xs text-transparent"
              />
            </Link>
            <Tooltip hoverRef={homeRef}>{t.layout.home}</Tooltip>

            <div className="flex items-center gap-4">
              <HighlightLink
                to={appRoutes.aram({})}
                parser={appParsers.aram}
                tooltip={t.layout.aramSpecificBalanceChanges}
                className="py-2"
              >
                <HowlingAbyssSimple className="w-5" />
              </HighlightLink>

              <HighlightLink
                to={appRoutes.factions({})}
                parser={appParsers.factions}
                tooltip={t.layout.globetrotterChallenges}
                className="py-2"
              >
                <MaskedImage src={Assets.runeterra} className="h-5 w-5" />
              </HighlightLink>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <SearchSummoner />

            {pipe(
              matchLocation(appParsers.anyPlatformRiotId),
              Maybe.fold(
                () => null,
                ({ platform, riotId }) => (
                  <div className="flex flex-wrap items-center gap-4 py-2">
                    <HighlightLink
                      to={appRoutes.platformRiotId(platform, riotId, {})}
                      parser={appParsers.platformRiotId}
                      tooltip={t.layout.championMasteries}
                      className="mt-0.5 py-0.5"
                    >
                      {t.layout.profile}
                    </HighlightLink>
                    <HighlightLink
                      to={appRoutes.platformRiotIdGame(platform, riotId)}
                      parser={appParsers.platformRiotIdGame}
                      tooltip={t.layout.activeGame}
                      className="mt-0.5 py-0.5"
                    >
                      {t.layout.game}
                    </HighlightLink>
                  </div>
                ),
              ),
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 self-stretch">
            {pipe(
              user,
              AsyncState.fold(
                () => <Loading className="my-2 h-5" />,
                () => <AccountDisconnected />,
                Maybe.fold(
                  () => <AccountDisconnected />,
                  u => <AccountConnected user={u} />,
                ),
              ),
            )}

            <Languages />
          </div>
        </div>
      </header>
      <main className="grow overflow-auto">{children}</main>
    </div>
  )
}
