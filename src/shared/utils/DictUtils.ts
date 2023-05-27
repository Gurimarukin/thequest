import type { Dict, List, Tuple } from './fp'

const keys = Object.keys as <K extends string>(r: Dict<K, unknown>) => List<K>

const entries = Object.entries as <K extends string, A>(r: Dict<K, A>) => List<Tuple<K, A>>

export const DictUtils = { keys, entries }
