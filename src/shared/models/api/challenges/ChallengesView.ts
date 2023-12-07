import * as C from 'io-ts/Codec'

import { DictUtils } from '../../../utils/DictUtils'
import { type Dict, Maybe } from '../../../utils/fp'
import { ChallengeId } from '../ChallengeId'
import type { ChampionFaction } from '../champion/ChampionFaction'
import { ChallengeView } from './ChallengeView'

type ChallengesView = C.TypeOf<typeof codec>

const maybeChallengeCodec = Maybe.codec(ChallengeView.codec)

const properties: Dict<ChampionFaction, typeof maybeChallengeCodec> = {
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

const codec = C.struct(properties)

const id: Dict<ChampionFaction, ChallengeId> = {
  bandle: ChallengeId(303501),
  bilgewater: ChallengeId(303502),
  demacia: ChallengeId(303503),
  freljord: ChallengeId(303504),
  ionia: ChallengeId(303505),
  ixtal: ChallengeId(303506),
  noxus: ChallengeId(303507),
  piltover: ChallengeId(303508),
  shadowIsles: ChallengeId(303509),
  shurima: ChallengeId(303510),
  targon: ChallengeId(303511),
  void: ChallengeId(303512),
  zaun: ChallengeId(303513),
}

const idEntries = DictUtils.entries(id)

const ChallengesView = { id, idEntries, codec }

export { ChallengesView }
