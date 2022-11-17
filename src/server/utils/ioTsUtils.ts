import { predicate, string } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import type { Decoder } from 'io-ts/Decoder'
import * as D from 'io-ts/Decoder'

import { DayJs } from '../../shared/models/DayJs'
import { List, NonEmptyArray } from '../../shared/utils/fp'

/**
 * DayJsFromNumber
 */

const dayJsFromNumberDecoder: Decoder<unknown, DayJs> = pipe(
  D.number,
  D.parse(n => {
    const d = DayJs.of(n)
    return DayJs.isValid(d) ? D.success(d) : D.failure(n, 'DayJsFromNumber')
  }),
)

export const DayJsFromNumber = { decoder: dayJsFromNumberDecoder }

/**
 * NumberFromString
 */

const numberFromStringDecoder: Decoder<unknown, number> = pipe(
  D.string,
  D.parse(s => {
    const n = Number(s)
    return isNaN(n) ? D.failure(s, 'NumberFromString') : D.success(n)
  }),
)

export const NumberFromString = { decoder: numberFromStringDecoder }

/**
 * NonEmptyArrayFromString
 */

const prepareArray: (i: string) => List<string> = flow(
  string.split(','),
  NonEmptyArray.map(string.trim),
  List.filter(predicate.not(string.isEmpty)),
)

const nonEmptyArrayFromStringDecoder = <A>(
  decoder: Decoder<unknown, A>,
): Decoder<unknown, NonEmptyArray<A>> =>
  pipe(D.string, D.map(prepareArray), D.compose(NonEmptyArray.decoder(decoder)))

export const NonEmptyArrayFromString = { decoder: nonEmptyArrayFromStringDecoder }
