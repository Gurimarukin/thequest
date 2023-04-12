import { pipe } from 'fp-ts/function'
import * as D from 'io-ts/Decoder'
import type { Encoder } from 'io-ts/Encoder'
import * as E from 'io-ts/Encoder'
import qs from 'qs'

import { ChampionLevelOrZero } from '../../../shared/models/api/champion/ChampionLevel'
import { Dict } from '../../../shared/utils/fp'
import { NonEmptyString, SetFromString } from '../../../shared/utils/ioTsUtils'

import { isDefined } from '../../utils/isDefined'
import { MasteriesQueryOrder } from './MasteriesQueryOrder'
import { MasteriesQuerySort } from './MasteriesQuerySort'
import { MasteriesQueryView } from './MasteriesQueryView'

type PartialMasteriesQuery = D.TypeOf<typeof decoder>

const properties = {
  sort: MasteriesQuerySort.codec,
  order: MasteriesQueryOrder.codec,
  view: MasteriesQueryView.codec,
  level: SetFromString.codec(ChampionLevelOrZero.stringCodec, ChampionLevelOrZero.Eq),
  search: NonEmptyString.codec,
}

const decoder = D.partial(properties)

type Out = Partial<Dict<keyof PartialMasteriesQuery, string>>
const encoder: Encoder<Out, PartialMasteriesQuery> = E.partial(properties)

const qsStringify = (query: PartialMasteriesQuery): string =>
  pipe(query, Dict.filter(isDefined), PartialMasteriesQuery.encoder.encode, qs.stringify)

const PartialMasteriesQuery = { decoder, encoder, qsStringify }

export { PartialMasteriesQuery }
