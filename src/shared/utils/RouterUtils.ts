import { Formatter, Match, Parser, Route } from 'fp-ts-routing'
import { pipe } from 'fp-ts/function'
import type { Codec } from 'io-ts/Codec'

import type { Dict } from './fp'
import { List, Maybe, NonEmptyArray, Tuple } from './fp'

const codec_ = <K extends string, A>(k: K, codec: Codec<string, string, A>): Match<Dict<K, A>> =>
  new Match(
    new Parser(r => {
      if (!List.isNonEmpty(r.parts)) return Maybe.none
      const [head, tail] = NonEmptyArray.unprepend(r.parts)
      return pipe(
        codec.decode(head),
        Maybe.fromEither,
        Maybe.map(a => Tuple.of(singleton(k, a), new Route(List.asMutable(tail), r.query))),
      )
    }),
    new Formatter((r, o) => new Route(r.parts.concat(codec.encode(o[k])), r.query)),
  )

const singleton = <K extends string, A>(k: K, a: A): Dict<K, A> => ({ [k]: a }) as Dict<K, A>

export const RouterUtils = { codec: codec_ }
