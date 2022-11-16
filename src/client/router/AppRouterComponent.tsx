/* eslint-disable functional/no-expression-statement */
import { Route, parse, zero } from 'fp-ts-routing'
import { pipe } from 'fp-ts/function'
import React, { useEffect, useMemo } from 'react'

import { Maybe, Tuple } from '../../shared/utils/fp'

import { Link } from '../components/Link'
import { useHistory } from '../contexts/HistoryContext'
import { Home } from '../domain/Home'
import { Summoner } from '../domain/Summoner'
import { appParsers, appRoutes } from './AppRouter'

type ElementWithTitle = Tuple<JSX.Element, Maybe<string>>

const t = (element: JSX.Element, title?: string): ElementWithTitle =>
  Tuple.of(element, Maybe.fromNullable(title))

const titleWithElementParser = zero<ElementWithTitle>()
  .alt(appParsers.index.map(() => t(<Home />)))
  .alt(
    appParsers.platformSummonerName.map(({ platform, summonerName }) =>
      t(<Summoner platform={platform} summonerName={summonerName} />, summonerName),
    ),
  )

export const AppRouterComponent = (): JSX.Element => {
  const { location } = useHistory()

  const [node, title] = useMemo(() => {
    const [node_, subTitle] = parse(
      titleWithElementParser,
      Route.parse(location.pathname),
      t(<NotFound />, 'Page non trouvée'),
    )
    const title_ = `La quêêête${pipe(
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

// TODO: move to own file?
const NotFound = (): JSX.Element => (
  <div className="flex flex-col items-center gap-4 p-6">
    <p className="text-xl">Cette page n'existe pas.</p>
    <Link to={appRoutes.index} className="underline">
      Accueil
    </Link>
  </div>
)
