import { flow, pipe } from 'fp-ts/function'

import { ChallengeId } from '../../shared/models/api/ChallengeId'
import { ChallengesView } from '../../shared/models/api/challenges/ChallengesView'
import type { ChampionFaction } from '../../shared/models/api/champion/ChampionFaction'
import { List, Maybe, Tuple } from '../../shared/utils/fp'

const challenge =
  <A>(onNone: (id: ChallengeId) => A, onSome: (faction: ChampionFaction) => A) =>
  (challengeId: ChallengeId): A =>
    pipe(
      ChallengesView.idEntries,
      List.findFirst(([, id]) => ChallengeId.Eq.equals(id, challengeId)),
      Maybe.fold(() => onNone(challengeId), flow(Tuple.fst, onSome)),
    )

export const TranslationUtils = { challenge }
