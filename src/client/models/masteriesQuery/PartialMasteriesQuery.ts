import { readonlySet } from 'fp-ts'
import type { Eq } from 'fp-ts/Eq'
import { pipe } from 'fp-ts/function'
import type { Codec } from 'io-ts/Codec'
import * as C from 'io-ts/Codec'
import * as D from 'io-ts/Decoder'
import type { Encoder } from 'io-ts/Encoder'
import * as E from 'io-ts/Encoder'
import qs from 'qs'

import { ChampionLevelOrZero } from '../../../shared/models/api/champion/ChampionLevel'
import { ChampionPosition } from '../../../shared/models/api/champion/ChampionPosition'
import type { PartialDict } from '../../../shared/utils/fp'
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
  level: setFromStringOrAllCodec(
    ChampionLevelOrZero.stringCodec,
    ChampionLevelOrZero.Eq,
    new Set(ChampionLevelOrZero.values),
  ),
  position: setFromStringOrAllCodec(
    ChampionPosition.codec,
    ChampionPosition.Eq,
    new Set(ChampionPosition.values),
  ),
  search: NonEmptyString.codec,
}

const decoder = D.partial(properties)

type Out = PartialDict<keyof PartialMasteriesQuery, string>
const encoder: Encoder<Out, PartialMasteriesQuery> = E.partial(properties)

const qsStringify = (query: PartialMasteriesQuery): string =>
  pipe(query, Dict.filter(isDefined), encoder.encode, qs.stringify)

const PartialMasteriesQuery = { decoder, qsStringify }

export { PartialMasteriesQuery }

function setFromStringOrAllCodec<A>(
  codec: Codec<unknown, string, A>,
  eq_: Eq<A>,
  allValues: ReadonlySet<A>,
): Codec<unknown, string, ReadonlySet<A>> {
  const setCodec = SetFromString.codec(codec, eq_)
  const setEq = readonlySet.getEq(eq_)
  return C.make(
    D.union(
      pipe(
        D.literal('all'),
        D.map(() => allValues),
      ),
      setCodec,
    ),
    { encode: set => (setEq.equals(set, allValues) ? 'all' : setCodec.encode(set)) },
  )
}
