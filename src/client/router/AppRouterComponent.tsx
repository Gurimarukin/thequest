/* eslint-disable functional/no-expression-statements */
import type { Match, Parser } from 'fp-ts-routing'
import { Route, format, parse, zero } from 'fp-ts-routing'
import { pipe } from 'fp-ts/function'
import { useEffect, useMemo } from 'react'

import type { Platform, PlatformLower } from '../../shared/models/api/Platform'
import { StringUtils } from '../../shared/utils/StringUtils'
import { Maybe, Tuple } from '../../shared/utils/fp'

import { Navigate } from '../components/Navigate'
import { useHistory } from '../contexts/HistoryContext'
import { Factions } from '../domain/Factions'
import { Home } from '../domain/Home'
import { Login } from '../domain/Login'
import { NotFound } from '../domain/NotFound'
import { Register } from '../domain/Register'
import { ActiveGame } from '../domain/activeGame/ActiveGame'
import { Aram } from '../domain/aram/Aram'
import { DiscordRedirect } from '../domain/discordRedirect/DiscordRedirect'
import { SummonerMasteries } from '../domain/summonerMasteries/SummonerMasteries'
import { SummonerPuuid } from '../domain/summonerMasteries/SummonerPuuid'
import { appMatches, appParsers } from './AppRouter'

type ElementWithTitle = Tuple<React.ReactElement, Maybe<string>>

const titleWithElementParser = zero<ElementWithTitle>()
  .alt(appParsers.index.map(() => t(<Home />)))
  .alt(
    withPlatformLower(appMatches.sPlatformPuuid, ({ platform, puuid }) =>
      t(<SummonerPuuid platform={platform} puuid={puuid} page="profile" />),
    ),
  )
  .alt(
    withPlatformLower(appMatches.sPlatformPuuidGame, ({ platform, puuid }) =>
      t(<SummonerPuuid platform={platform} puuid={puuid} page="game" />),
    ),
  )
  .alt(
    withPlatformLower(appMatches.platformSummonerName, ({ platform, summonerName }) =>
      t(
        <SummonerMasteries platform={platform} summonerName={summonerName} />,
        `${summonerName} (${platform})`,
      ),
    ),
  )
  .alt(
    withPlatformLower(appMatches.platformSummonerNameGame, ({ platform, summonerName }) =>
      t(
        <ActiveGame platform={platform} summonerName={summonerName} />,
        `${summonerName} (${platform}) | partie`,
      ),
    ),
  )
  .alt(appParsers.aram.map(() => t(<Aram />, 'ARAM')))
  .alt(appParsers.factions.map(() => t(<Factions />, 'Factions')))
  .alt(appParsers.login.map(() => t(<Login />, 'Connexion')))
  .alt(appParsers.register.map(() => t(<Register />, 'Inscription')))
  .alt(appParsers.discordRedirect.map(() => t(<DiscordRedirect />)))

export const AppRouterComponent: React.FC = () => {
  const { location } = useHistory()

  const [node, title] = useMemo(() => {
    const [node_, subTitle] = parse(
      titleWithElementParser,
      Route.parse(location.pathname),
      t(<NotFound />, 'Page non trouvée'),
    )
    const title_ = `La Quête${pipe(
      subTitle,
      Maybe.fold(
        () => '',
        s => ` | ${s}`,
      ),
    )}`
    return [node_, title_]
  }, [location.pathname])

  useEffect(() => {
    // eslint-disable-next-line functional/immutable-data
    document.title = title
  }, [title])

  return node
}

const t = (element: React.ReactElement, title?: string): ElementWithTitle =>
  Tuple.of(element, Maybe.fromNullable(title))

type Platformable = {
  platform: Platform | PlatformLower
}

type UppercasePlatform<A extends Platformable> = Omit<A, 'platform'> & {
  platform: Uppercase<A['platform']>
}

// Redirect if upper case
function withPlatformLower<A extends Platformable>(
  match: Match<A>,
  f: (a: UppercasePlatform<A>) => ElementWithTitle,
): Parser<ElementWithTitle> {
  return match.parser.map(a => {
    const upperCase = StringUtils.toUpperCase<A['platform']>(a.platform)
    const isUppercase = upperCase === a.platform

    return isUppercase
      ? t(
          <Navigate
            to={format(match.formatter, { ...a, platform: a.platform.toLowerCase() })}
            replace={true}
          />,
        )
      : f({ ...a, platform: upperCase })
  })
}
