import type { Match, Parser } from 'fp-ts-routing'
import { format, zero } from 'fp-ts-routing'
import { lazy } from 'react'
import type { Merge } from 'type-fest'

import type { Platform, PlatformLower } from '../../shared/models/api/Platform'
import { RiotId } from '../../shared/models/riot/RiotId'
import { StringUtils } from '../../shared/utils/StringUtils'

import { Urf } from '../Urf'
import { LoadingSuspense } from '../components/LoadingSuspense'
import { Navigate } from '../components/Navigate'
import { Factions } from '../domain/Factions'
import { Home } from '../domain/Home'
import { Login } from '../domain/Login'
import { Register } from '../domain/Register'
import { SummonerByPuuidGame, SummonerByPuuidProfile } from '../domain/SummonerBy'
import { ActiveGame } from '../domain/activeGame/ActiveGame'
import { Aram } from '../domain/aram/Aram'
import { DiscordRedirect } from '../domain/discordRedirect/DiscordRedirect'
import { SummonerMasteries } from '../domain/summonerMasteries/SummonerMasteries'
import { appMatches, appParsers } from './AppRouter'
import type { ElementWithTitle } from './getRouterComponent'
import { e, getRouterComponent } from './getRouterComponent'

const AdminRouterComponent = lazy(() => import('./AdminRouterComponent'))

export const AppRouterComponent: React.FC = getRouterComponent(
  zero<ElementWithTitle>()
    .alt(appParsers.index.map(() => e(<Home />)))
    .alt(
      withPlatformLower(appMatches.sPlatformPuuid, ({ platform, puuid }) =>
        e(<SummonerByPuuidProfile platform={platform} puuid={puuid} />),
      ),
    )
    .alt(
      withPlatformLower(appMatches.sPlatformPuuidGame, ({ platform, puuid }) =>
        e(<SummonerByPuuidGame platform={platform} puuid={puuid} />),
      ),
    )
    .alt(
      withPlatformLower(appMatches.platformRiotId, ({ platform, riotId }) =>
        e(
          <SummonerMasteries platform={platform} riotId={riotId} />,
          () => `${RiotId.stringify(riotId)} (${platform})`,
        ),
      ),
    )
    .alt(
      withPlatformLower(appMatches.platformRiotIdGame, ({ platform, riotId }) =>
        e(
          <ActiveGame platform={platform} riotId={riotId} />,
          t => `${RiotId.stringify(riotId)} (${platform}) | ${t.game})`,
        ),
      ),
    )
    .alt(appParsers.aram.map(() => e(<Aram />, t => t.aram)))
    .alt(appParsers.urf.map(() => e(<Urf />, t => t.urf)))
    .alt(appParsers.factions.map(() => e(<Factions />, t => t.factions)))
    .alt(appParsers.login.map(() => e(<Login />, t => t.login)))
    .alt(appParsers.register.map(() => e(<Register />, t => t.register)))
    .alt(appParsers.discordRedirect.map(() => e(<DiscordRedirect />)))
    .alt(
      appParsers.anyAdmin.map(() =>
        e(
          <LoadingSuspense>
            <AdminRouterComponent />
          </LoadingSuspense>,
        ),
      ),
    ),
)

type Platformable = {
  platform: Platform | PlatformLower
}

type UppercasePlatform<A extends Platformable> = Merge<
  A,
  {
    platform: Uppercase<A['platform']>
  }
>

// Redirect if upper case
function withPlatformLower<A extends Platformable>(
  match: Match<A>,
  f: (a: UppercasePlatform<A>) => ElementWithTitle,
): Parser<ElementWithTitle> {
  return match.parser.map(a => {
    const upperCase = StringUtils.toUpperCase<A['platform']>(a.platform)
    const isUppercase = upperCase === a.platform

    return isUppercase
      ? e(
          <Navigate
            to={format(match.formatter, { ...a, platform: a.platform.toLowerCase() })}
            replace={true}
          />,
        )
      : f({ ...a, platform: upperCase })
  })
}
