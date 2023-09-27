/* eslint-disable functional/no-expression-statements */
import { eq, string, task } from 'fp-ts'
import type { Route } from 'fp-ts-routing'
import { Parser } from 'fp-ts-routing'
import type { Eq } from 'fp-ts/Eq'
import { pipe } from 'fp-ts/function'
import { useCallback, useState } from 'react'

import { Platform } from '../../../shared/models/api/Platform'
import type { UserView } from '../../../shared/models/api/user/UserView'
import { Future, Maybe } from '../../../shared/utils/fp'

import { apiUserLogoutPost } from '../../api'
import { useHistory } from '../../contexts/HistoryContext'
import { useStaticData } from '../../contexts/StaticDataContext'
import { useTranslation } from '../../contexts/TranslationContext'
import { useUser } from '../../contexts/UserContext'
import { MasteriesQuery } from '../../models/masteriesQuery/MasteriesQuery'
import { appParsers, appRoutes } from '../../router/AppRouter'
import { futureRunUnsafe } from '../../utils/futureRunUnsafe'
import { ClickOutside } from '../ClickOutside'
import { Loading } from '../Loading'
import { HighlightLink } from './HighlightLink'
import { Menu } from './Menu'

type AccountConnectedProps = {
  user: UserView
}

export const AccountConnected: React.FC<AccountConnectedProps> = ({ user }) => {
  const { matchLocation, masteriesQuery } = useHistory()
  const { refreshUser } = useUser()
  const { t } = useTranslation('common')
  const staticData = useStaticData()

  const matchSummoner = matchLocation(appParsers.platformSummonerName)

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
            ({ platform, puuid, name, profileIconId }) => (
              <HighlightLink
                to={(Maybe.isSome(matchLocation(appParsers.platformSummonerNameGame))
                  ? appRoutes.sPlatformPuuidGame
                  : appRoutes.sPlatformPuuid)(
                  platform,
                  puuid,
                  Maybe.isSome(matchSummoner)
                    ? MasteriesQuery.toPartial({ ...masteriesQuery, search: Maybe.none })
                    : {},
                )}
                parser={anyPlatformSummonerNameExact(platform, name)}
                tooltip={`${name} — ${platform}`}
                className="py-1.5"
              >
                <img
                  src={staticData.assets.summonerIcon(profileIconId)}
                  alt={t.summonerIconAlt(name)}
                  className="w-[30px] shadow-even shadow-black"
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

type PlatformSummonerName<P extends Platform, S extends string> = {
  platform: P
  summonerName: S
}

const platformSummonerNameEq: Eq<PlatformSummonerName<Platform, string>> = eq.struct({
  platform: Platform.Eq,
  summonerName: string.Eq,
})

function anyPlatformSummonerNameExact<P extends Platform, S extends string>(
  platform: P,
  summonerName: S,
): Parser<PlatformSummonerName<P, S>> {
  return new Parser(r =>
    pipe(
      appParsers.anyPlatformSummonerName.run(r),
      Maybe.filter((tuple): tuple is [PlatformSummonerName<P, S>, Route] =>
        platformSummonerNameEq.equals(tuple[0], { platform, summonerName }),
      ),
    ),
  )
}
