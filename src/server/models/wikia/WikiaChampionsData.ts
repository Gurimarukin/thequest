import { flow, pipe } from 'fp-ts/function'
import type { Decoder } from 'io-ts/Decoder'
import * as D from 'io-ts/Decoder'
import { Table } from 'lua-in-js'

import { DictUtils } from '../../../shared/utils/DictUtils'
import { List } from '../../../shared/utils/fp'

import { RawWikiaChampionData, WikiaChampionData } from './WikiaChampionData'

type WikiaChampionsData = D.TypeOf<typeof decoder>

const tableDecoder: Decoder<unknown, unknown[] | Record<string, unknown>> = pipe(
  D.id<unknown>(),
  D.parse(i => (i instanceof Table ? D.success(i) : D.failure(i, 'Table'))),
  D.map(t => t.toObject()),
)

const decoder = pipe(
  tableDecoder,
  D.compose(D.record(RawWikiaChampionData.decoder)),
  D.map(flow(DictUtils.entries, List.map(WikiaChampionData.fromTuple))),
)

const WikiaChampionsData = { decoder }

export { WikiaChampionsData }
