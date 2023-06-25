import type { Dict, List, PartialDict, Tuple } from './fp'

export const DictUtils = {
  entries: Object.entries as <K extends string, A>(r: Dict<K, A>) => List<Tuple<K, A>>,

  keys: Object.keys as <K extends string>(r: Dict<K, unknown>) => List<K>,

  values: Object.values as <A>(r: Dict<string, A>) => List<A>,

  partial: {
    entries: Object.entries as <K extends string, A>(
      r: PartialDict<K, A>,
    ) => List<Tuple<K, A | undefined>>,

    values: Object.values as <A>(r: PartialDict<string, A>) => List<A>,
  },
}
