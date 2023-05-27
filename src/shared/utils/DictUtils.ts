import type { Dict, List, PartialDict, Tuple } from './fp'

export const DictUtils = {
  keys: Object.keys as <K extends string>(r: Dict<K, unknown>) => List<K>,
  entries: Object.entries as <K extends string, A>(r: Dict<K, A>) => List<Tuple<K, A>>,
  partial: {
    entries: Object.entries as <K extends string, A>(
      r: PartialDict<K, A>,
    ) => List<Tuple<K, A | undefined>>,
  },
}
