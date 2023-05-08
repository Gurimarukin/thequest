/* eslint-disable functional/no-expression-statements */
import { Route, parse, zero } from 'fp-ts-routing'
import { pipe } from 'fp-ts/function'
import { useEffect, useMemo } from 'react'

import { Maybe, Tuple } from '../../shared/utils/fp'

import { useHistory } from '../contexts/HistoryContext'
import { Home } from '../domain/Home'
import { Login } from '../domain/Login'
import { NotFound } from '../domain/NotFound'
import { Register } from '../domain/Register'
import { Aram } from '../domain/aram/Aram'
import { DiscordRedirect } from '../domain/discordRedirect/DiscordRedirect'
import { SummonerMasteries } from '../domain/summonerMasteries/SummonerMasteries'
import { appParsers } from './AppRouter'

type ElementWithTitle = Tuple<React.JSX.Element, Maybe<string>>

const t = (element: React.JSX.Element, title?: string): ElementWithTitle =>
  Tuple.of(element, Maybe.fromNullable(title))

const titleWithElementParser = zero<ElementWithTitle>()
  .alt(appParsers.index.map(() => t(<Home />)))
  .alt(
    appParsers.platformSummonerName.map(({ platform, summonerName }) =>
      t(<SummonerMasteries platform={platform} summonerName={summonerName} />, summonerName),
    ),
  )
  .alt(appParsers.aram.map(() => t(<Aram />, 'ARAM')))
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
