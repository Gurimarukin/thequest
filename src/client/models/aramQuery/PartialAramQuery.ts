import { pipe } from 'fp-ts/function'
import * as D from 'io-ts/Decoder'
import type { Encoder } from 'io-ts/Encoder'
import * as E from 'io-ts/Encoder'
import qs from 'qs'

import { Dict } from '../../../shared/utils/fp'
import { NonEmptyString } from '../../../shared/utils/ioTsUtils'

import { isDefined } from '../../utils/isDefined'

type PartialAramQuery = D.TypeOf<typeof decoder>

const properties = {
  search: NonEmptyString.codec,
}

const decoder = D.partial(properties)

type Out = Partial<Dict<keyof PartialAramQuery, string>>
const encoder: Encoder<Out, PartialAramQuery> = E.partial(properties)

const qsStringify = (query: PartialAramQuery): string =>
  pipe(query, Dict.filter(isDefined), encoder.encode, qs.stringify)

const PartialAramQuery = { decoder, qsStringify }

export { PartialAramQuery }
