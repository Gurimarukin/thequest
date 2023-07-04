import { flow, pipe } from 'fp-ts/function'

import { ChallengeId } from '../../shared/models/api/ChallengeId'
import type { Lang } from '../../shared/models/api/Lang'
import { ChallengesView } from '../../shared/models/api/challenges/ChallengesView'
import type { ChampionFaction } from '../../shared/models/api/champion/ChampionFaction'
import type { Dict } from '../../shared/utils/fp'
import { List, Maybe, Tuple } from '../../shared/utils/fp'

const langLabel: Dict<Lang, string> = {
  en_GB: 'English',
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

export const TranslationUtils = { labels: { lang: langLabel }, challenge }
