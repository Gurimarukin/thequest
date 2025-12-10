import { pipe } from 'fp-ts/function'
import type { Decoder } from 'io-ts/Decoder'
import * as D from 'io-ts/Decoder'
import { Table } from 'lua-in-js'

import type { Dict, List } from '../../../shared/utils/fp'

type LuaTable = List<unknown> | Dict<string, unknown>

const decoder: Decoder<unknown, LuaTable> = pipe(
  D.id<unknown>(),
  D.parse(i => (i instanceof Table ? D.success(i) : D.failure(i, 'Table'))),
  D.map(t => t.toObject()),
)

const LuaTable = { decoder }

export { LuaTable }
