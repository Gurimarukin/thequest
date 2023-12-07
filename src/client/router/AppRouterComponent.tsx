/* eslint-disable functional/no-expression-statements */
import type { Match, Parser } from 'fp-ts-routing'
import { Route, format, parse, zero } from 'fp-ts-routing'
import { pipe } from 'fp-ts/function'
import { useEffect, useMemo } from 'react'

import type { Platform, PlatformLower } from '../../shared/models/api/Platform'
import { RiotId } from '../../shared/models/riot/RiotId'
import type { Override } from '../../shared/models/typeFest'
import { StringUtils } from '../../shared/utils/StringUtils'
import { Maybe, Tuple } from '../../shared/utils/fp'

import { Navigate } from '../components/Navigate'
import { useHistory } from '../contexts/HistoryContext'
import { useTranslation } from '../contexts/TranslationContext'
import { Factions } from '../domain/Factions'
import { Home } from '../domain/Home'
import { Login } from '../domain/Login'
import { NotFound } from '../domain/NotFound'
import { Register } from '../domain/Register'
import {
  SummonerByNameGame,
  SummonerByNameProfile,
  SummonerByPuuidGame,
  SummonerByPuuidProfile,
} from '../domain/SummonerBy'
import { ActiveGame } from '../domain/activeGame/ActiveGame'
import { Aram } from '../domain/aram/Aram'
import { DiscordRedirect } from '../domain/discordRedirect/DiscordRedirect'
import { SummonerMasteries } from '../domain/summonerMasteries/SummonerMasteries'
import type { Translation } from '../models/Translation'
import { appMatches, appParsers } from './AppRouter'

type ElementWithTitle = Tuple<React.ReactElement, Maybe<(t: Translation['router']) => string>>

const titleWithElementParser = zero<ElementWithTitle>()
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
  .alt(
    withPlatformLower(appMatches.platformSummonerName, ({ platform, summonerName }) =>
      e(<SummonerByNameProfile platform={platform} name={summonerName} />),
    ),
  )
  .alt(
    withPlatformLower(appMatches.platformSummonerNameGame, ({ platform, summonerName }) =>
      e(<SummonerByNameGame platform={platform} name={summonerName} />),
    ),
  )
  .alt(appParsers.aram.map(() => e(<Aram />, t => t.aram)))
  .alt(appParsers.factions.map(() => e(<Factions />, t => t.factions)))
  .alt(appParsers.login.map(() => e(<Login />, t => t.login)))
  .alt(appParsers.register.map(() => e(<Register />, t => t.register)))
  .alt(appParsers.discordRedirect.map(() => e(<DiscordRedirect />)))

export const AppRouterComponent: React.FC = () => {
  const { t } = useTranslation('router')
  const { location } = useHistory()

  const [node, title] = useMemo(() => {
    const [node_, subTitle] = parse(
      titleWithElementParser,
      Route.parse(location.pathname),
      e(<NotFound />, t_ => t_.notFound),
    )
    const title_ = `La Quête${pipe(
      subTitle,
      Maybe.fold(
        () => '',
        s => ` | ${s(t)}`,
      ),
    )}`
    return [node_, title_]
  }, [location.pathname, t])

  useEffect(() => {
    // eslint-disable-next-line functional/immutable-data
    document.title = title
  }, [title])

  return node
}

const e = (
  element: React.ReactElement,
  title?: (t: Translation['router']) => string,
): ElementWithTitle => Tuple.of(element, Maybe.fromNullable(title))

type Platformable = {
  platform: Platform | PlatformLower
}

type UppercasePlatform<A extends Platformable> = Override<A, 'platform', Uppercase<A['platform']>>

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
