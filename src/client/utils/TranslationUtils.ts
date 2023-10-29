import { flow, pipe } from 'fp-ts/function'

import { ChallengeId } from '../../shared/models/api/ChallengeId'
import type { Lang } from '../../shared/models/api/Lang'
import { ChallengesView } from '../../shared/models/api/challenges/ChallengesView'
import type { ChampionFaction } from '../../shared/models/api/champion/ChampionFaction'
import { NumberUtils } from '../../shared/utils/NumberUtils'
import type { Dict } from '../../shared/utils/fp'
import { List, Maybe, Tuple } from '../../shared/utils/fp'

import type { Translation } from '../models/Translation'

const { round } = NumberUtils

const langLabel: Dict<Lang, string> = {
  en_GB: 'English',
  es_ES: 'ESPAGNYÕLO',
  fr_FR: 'Français',
}

const challenge =
  <A>(onNone: (id: ChallengeId) => A, onSome: (faction: ChampionFaction) => A) =>
  (challengeId: ChallengeId): A =>
    pipe(
      ChallengesView.idEntries,
      List.findFirst(([, id]) => ChallengeId.Eq.equals(id, challengeId)),
      Maybe.fold(() => onNone(challengeId), flow(Tuple.fst, onSome)),
    )

const numberUnit = (t: Translation['common']) => (pts: number) => {
  if (1000000 <= pts) return t.numberM(round(pts / 1000000, 1))
  if (1000 <= pts) return t.numberK(round(pts / 1000, 1))
  return t.number(pts)
}

export const TranslationUtils = { labels: { lang: langLabel }, challenge, numberUnit }
