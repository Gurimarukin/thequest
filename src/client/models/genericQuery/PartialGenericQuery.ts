import { pipe } from 'fp-ts/function'
import * as D from 'io-ts/Decoder'
import type { Encoder } from 'io-ts/Encoder'
import * as E from 'io-ts/Encoder'
import qs from 'qs'

import type { PartialDict } from '../../../shared/utils/fp'
import { Dict } from '../../../shared/utils/fp'
import { NonEmptyString } from '../../../shared/utils/ioTsUtils'

import { isDefined } from '../../utils/isDefined'

type PartialGenericQuery = D.TypeOf<typeof decoder>

const properties = {
  search: NonEmptyString.codec,
}

const decoder = D.partial(properties)

type Out = PartialDict<keyof PartialGenericQuery, string>
const encoder: Encoder<Out, PartialGenericQuery> = E.partial(properties)

const qsStringify = (query: PartialGenericQuery): string =>
  pipe(query, Dict.filter(isDefined), encoder.encode, qs.stringify)

const PartialGenericQuery = { decoder, qsStringify }

export { PartialGenericQuery }
