import { flow, pipe } from 'fp-ts/function'
import type { Decoder } from 'io-ts/Decoder'
import * as D from 'io-ts/Decoder'

import type { ValidatedNea } from '../../models/ValidatedNea'
import type { PartialDict, Try } from '../fp'
import { Either, List, NonEmptyArray } from '../fp'

export type DecodeKey = <B>(
  decoder: Decoder<unknown, B>,
) => (key: string) => ValidatedNea<string, B>

export const parseConfig =
  (rawConfig: PartialDict<string, string>) =>
  <A>(f: (r: DecodeKey) => ValidatedNea<string, A>): Try<A> =>
    pipe(
      f(
        <B>(decoder: Decoder<unknown, B>) =>
          (key: string) =>
            pipe(
              decoder.decode(rawConfig[key]),
              Either.mapLeft(e => NonEmptyArray.of(`${key}: ${D.draw(e)}`)),
            ),
      ),
      Either.mapLeft(flow(List.mkString('Errors while reading config:\n', '\n', ''), Error)),
    )
