/* eslint-disable functional/no-expression-statements */
import { task } from 'fp-ts'
import { Parser } from 'fp-ts-routing'
import { pipe } from 'fp-ts/function'
import { useCallback, useState } from 'react'

import { Permissions } from '../../../shared/Permissions'
import type { Platform } from '../../../shared/models/api/Platform'
import { PlatformWithRiotId } from '../../../shared/models/api/summoner/PlatformWithRiotId'
import type { UserView } from '../../../shared/models/api/user/UserView'
import { GameName } from '../../../shared/models/riot/GameName'
import { RiotId } from '../../../shared/models/riot/RiotId'
import { TagLine } from '../../../shared/models/riot/TagLine'
import { Future, Maybe } from '../../../shared/utils/fp'

import { apiUserLogoutPost } from '../../api'
import { useHistory } from '../../contexts/HistoryContext'
import { useStaticData } from '../../contexts/StaticDataContext'
import { useTranslation } from '../../contexts/TranslationContext'
import { useUser } from '../../contexts/UserContext'
import { usePathMatch } from '../../hooks/usePathMatch'
import { MasteriesQuery } from '../../models/masteriesQuery/MasteriesQuery'
import { adminRoutes } from '../../router/AdminRouter'
import { appParsers, appRoutes } from '../../router/AppRouter'
import { futureRunUnsafe } from '../../utils/futureRunUnsafe'
import { ClickOutside } from '../ClickOutside'
import { Link } from '../Link'
import { Loading } from '../Loading'
import { HighlightLink } from './HighlightLink'
import { Menu } from './Menu'

type AccountConnectedProps = {
  user: UserView
}

export const AccountConnected: React.FC<AccountConnectedProps> = ({ user }) => {
  const { masteriesQuery } = useHistory()
  const { refreshUser } = useUser()
  const { t } = useTranslation('common')
  const staticData = useStaticData()

  const summonerMatch = usePathMatch(appParsers.platformRiotId)
  const summonerGameMatch = usePathMatch(appParsers.platformRiotIdGame)

  const [menuIsVisible, setMenuIsVisible] = useState(false)
  const toggleMenu = useCallback(() => setMenuIsVisible(v => !v), [])
  const hideMenu = useCallback(() => setMenuIsVisible(false), [])

  const [isLoading, setIsLoading] = useState(false)

  const disconnect = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setIsLoading(true)
      return pipe(
        apiUserLogoutPost,
        Future.chain(() => refreshUser),
        task.chainFirstIOK(() => () => setIsLoading(false)),
        futureRunUnsafe,
      )
    }, // TODO: handle error
    [refreshUser],
  )

  return (
    <ClickOutside onClickOutside={hideMenu}>
      <div className="relative flex items-center gap-4 self-stretch py-2">
        {pipe(
          user.linkedRiotAccount,
          Maybe.fold(
            () => null,
            ({ platform, puuid, riotId, profileIconId }) => (
              <HighlightLink
                to={(summonerGameMatch !== undefined
                  ? appRoutes.sPlatformPuuidGame
                  : appRoutes.sPlatformPuuid)(
                  platform,
                  puuid,
                  summonerMatch !== undefined
                    ? MasteriesQuery.toPartial({ ...masteriesQuery, search: Maybe.none })
                    : {},
                )}
                parser={anyPlatformSummonerExact(platform, riotId)}
                tooltip={
                  <div className="flex items-baseline gap-1.5">
                    <div className="flex items-baseline gap-px">
                      <span className="font-medium text-goldenrod">
                        {GameName.unwrap(riotId.gameName)}
                      </span>
                      <span className="text-grey-500">#{TagLine.unwrap(riotId.tagLine)}</span>
                    </div>
                    <span>—</span>
                    <span>{platform}</span>
                  </div>
                }
                className="py-1.5"
              >
                <img
                  src={staticData.assets.summonerIcon(profileIconId)}
                  alt={t.summonerIconAlt(RiotId.stringify(riotId))}
                  className="w-7.5 shadow-even shadow-black"
                />
              </HighlightLink>
            ),
          ),
        )}

        <button type="button" onClick={toggleMenu} className="flex items-center gap-3 py-2">
          <span>{user.userName}</span>
        </button>

        {menuIsVisible ? (
          <Menu>
            <ul className="flex flex-col gap-0.5">
              {Permissions.canViewAdmin(user.role) ? (
                <li className="flex justify-center pb-1">
                  <Link to={adminRoutes.index} className="hover:underline">
                    ADMIN
                  </Link>
                </li>
              ) : null}
              <li>
                <button
                  type="button"
                  onClick={disconnect}
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-goldenrod px-4 py-1 text-black hover:bg-goldenrod/75 disabled:bg-grey-disabled"
                >
                  <span>{t.layout.logout}</span>
                  {isLoading ? <Loading className="h-4" /> : null}
                </button>
              </li>
            </ul>
          </Menu>
        ) : null}
      </div>
    </ClickOutside>
  )
}

function anyPlatformSummonerExact(platform: Platform, riotId: RiotId): Parser<PlatformWithRiotId> {
  return new Parser(r =>
    pipe(
      appParsers.anyPlatformRiotId.run(r),
      Maybe.filter(([a]) => PlatformWithRiotId.Eq.equals(a, { platform, riotId })),
    ),
  )
}
