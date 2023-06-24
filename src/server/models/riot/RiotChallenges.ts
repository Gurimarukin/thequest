import * as D from 'io-ts/Decoder'

import { LeagueTier } from '../../../shared/models/api/league/LeagueTier'
import { List } from '../../../shared/utils/fp'

import { DayJsFromNumber } from '../../utils/ioTsUtils'
import { ChallengeId } from './ChallengId'

type RiotChallenges = D.TypeOf<typeof decoder>

// const categoryDecoder = D.struct({
//   level: LeagueTier.decoder,
//   current: D.number,
//   max: D.number,
//   percentile: D.number,
// })

const decoder = D.struct({
  // totalPoints: categoryDecoder,
  // categoryPoints: D.struct({
  //   COLLECTION: categoryDecoder,
  //   IMAGINATION: categoryDecoder,
  //   VETERANCY: categoryDecoder,
  //   TEAMWORK: categoryDecoder,
  //   EXPERTISE: categoryDecoder,
  // }),
  challenges: List.decoder(
    D.struct({
      challengeId: ChallengeId.codec,
      percentile: D.number,
      level: LeagueTier.decoder,
      value: D.number,
      achievedTime: DayJsFromNumber.decoder,
    }),
  ),
  // preferences: D.struct({
  //   bannerAccent: '1',
  //   title: '30130106',
  //   challengeIds: [510000, 101101, 2023005],
  //   crestBorder: '1',
  //   prestigeCrestBorderLevel: 300,
  // }),
})

const RiotChallenges = { decoder }

export { RiotChallenges }
