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
  bandle: ChallengeId.wrap(303501),
  bilgewater: ChallengeId.wrap(303502),
  demacia: ChallengeId.wrap(303503),
  freljord: ChallengeId.wrap(303504),
  ionia: ChallengeId.wrap(303505),
  ixtal: ChallengeId.wrap(303506),
  noxus: ChallengeId.wrap(303507),
  piltover: ChallengeId.wrap(303508),
  shadowIsles: ChallengeId.wrap(303509),
  shurima: ChallengeId.wrap(303510),
  targon: ChallengeId.wrap(303511),
  void: ChallengeId.wrap(303512),
  zaun: ChallengeId.wrap(303513),
}

const idEntries = DictUtils.entries(id)

const ChallengesView = { id, idEntries, codec }

export { ChallengesView }