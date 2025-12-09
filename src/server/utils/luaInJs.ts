import * as luainjs from 'lua-in-js'

import { Try } from '../../shared/utils/fp'

export type LuaType = luainjs.utils.LuaType

export function luaInJsParse(str: string): Try<LuaType> {
  return Try.tryCatch(() => luainjs.createEnv().parse(str).exec())
}
