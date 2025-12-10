import { pipe } from 'fp-ts/function'
import * as D from 'io-ts/Decoder'

import { LuaTable } from './LuaTableDecoder'

type RawWikiChampionsData = D.TypeOf<typeof decoder>

const decoder = pipe(LuaTable.decoder, D.compose(D.UnknownRecord))

const RawWikiChampionsData = { decoder }

export { RawWikiChampionsData }
