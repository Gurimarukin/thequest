import * as C from 'io-ts/Codec'

import type { Dict } from '../../../utils/fp'
import { Maybe } from '../../../utils/fp'
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

const ChallengesView = { codec }

export { ChallengesView }
