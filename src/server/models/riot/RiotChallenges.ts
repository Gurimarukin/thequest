import { pipe } from 'fp-ts/function'
import * as D from 'io-ts/Decoder'

import { ChallengeId } from '../../../shared/models/api/ChallengeId'
import { LeagueTier } from '../../../shared/models/api/league/LeagueTier'
import { List, Maybe } from '../../../shared/utils/fp'

import { DayJsFromNumber } from '../../utils/ioTsUtils'

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
      level: pipe(
        LeagueTier.decoder,
        D.map(Maybe.some),
        D.alt(() =>
          pipe(
            D.literal('NONE'),
            D.map((): Maybe<LeagueTier> => Maybe.none),
          ),
        ),
      ),
      value: D.number,
      achievedTime: Maybe.decoder(DayJsFromNumber.decoder),
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
