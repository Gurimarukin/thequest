import * as C from 'io-ts/Codec'

import type { ChampionFaction } from '../../../shared/models/api/champion/ChampionFaction'
import { LeagueTier } from '../../../shared/models/api/league/LeagueTier'
import { Puuid } from '../../../shared/models/api/summoner/Puuid'
import type { Dict } from '../../../shared/utils/fp'
import { Maybe } from '../../../shared/utils/fp'

import { DayJsFromDate } from '../../utils/ioTsUtils'
import { ChallengeId } from '../riot/ChallengId'

type ChallengesDb = C.TypeOf<typeof codec>
type ChallengesDbOutput = C.OutputOf<typeof codec>

const maybeChallengeCodec = Maybe.codec(
  C.struct({
    challengeId: ChallengeId.codec,
    percentile: C.number,
    level: Maybe.codec(LeagueTier.codec),
    value: C.number,
    achievedTime: Maybe.codec(DayJsFromDate.codec),
  }),
)

const challengesProperties: Dict<ChampionFaction, typeof maybeChallengeCodec> = {
  bandle: maybeChallengeCodec,
  bilgewater: maybeChallengeCodec,
  demacia: maybeChallengeCodec,
  freljord: maybeChallengeCodec,
  ionia: maybeChallengeCodec,
  ixtal: maybeChallengeCodec,
  noxus: maybeChallengeCodec,
  piltover: maybeChallengeCodec,
  shadowIsles: maybeChallengeCodec,
  shurima: maybeChallengeCodec,
  targon: maybeChallengeCodec,
  void: maybeChallengeCodec,
  zaun: maybeChallengeCodec,
}

const codec = C.struct({
  puuid: Puuid.codec,
  challenges: C.struct(challengesProperties),
  insertedAt: DayJsFromDate.codec,
})

const ChallengesDb = { codec }

export { ChallengesDb, ChallengesDbOutput }
