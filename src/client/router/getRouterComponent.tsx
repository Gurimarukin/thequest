/* eslint-disable functional/no-expression-statements */
import { type Parser, Route, parse } from 'fp-ts-routing'
import { pipe } from 'fp-ts/function'
import { useEffect, useMemo } from 'react'

import { List, Maybe, Tuple } from '../../shared/utils/fp'

import { useHistory } from '../contexts/HistoryContext'
import { useTranslation } from '../contexts/TranslationContext'
import { NotFound } from '../domain/NotFound'
import type { Translation } from '../models/Translation'

export type ElementWithTitle = Tuple<
  React.ReactElement,
  Maybe<(t: Translation['router']) => string>
>

export function getRouterComponent(parser: Parser<ElementWithTitle>): React.FC {
  return function RouterComponent() {
    const { t } = useTranslation('router')
    const { location } = useHistory()

    const [node, title] = useMemo(() => {
      const [node_, subTitle] = parse(
        parser,
        Route.parse(location.pathname),
        e(<NotFound />, t_ => t_.notFound),
      )
      const title_ = pipe(
        [
          Maybe.some(t.theQuest),
          pipe(
            subTitle,
            Maybe.map(s => s(t)),
          ),
        ],
        List.compact,
        List.mkString(' | '),
      )
      return [node_, title_]
    }, [location.pathname, t])

    useEffect(() => {
      // eslint-disable-next-line functional/immutable-data
      document.title = title
    }, [title])

    return node
  }
}

export function e(
  element: React.ReactElement,
  title?: (t: Translation['router']) => string,
): ElementWithTitle {
  return Tuple.of(element, Maybe.fromNullable(title))
}
