import { pipe } from 'fp-ts/function'
import { optional } from 'monocle-ts'

import { SummonerMasteriesView } from '../../../../../src/shared/models/api/summoner/SummonerMasteriesView'
import type { SummonerView } from '../../../../../src/shared/models/api/summoner/SummonerView'
import { Dict, List, Maybe } from '../../../../../src/shared/utils/fp'

import type { SummonerId } from '../../../../../src/server/models/summoner/SummonerId'

import { expectT } from '../../../../expectT'

describe('SummonerMasteriesView.Lens.championShards.counts', () => {
  it('should lens', () => {
    const summoner: SummonerView = {
      id: '' as unknown as SummonerId,
      name: '',
      profileIconId: 0,
      summonerLevel: 0,
    }

    expectT(
      pipe(
        SummonerMasteriesView.Lens.championShards.counts,
        optional.modify(Dict.upsertAt('b', 2)),
      )({
        summoner,
        masteries: List.empty,
        championShards: Maybe.none,
      }),
    ).toStrictEqual({
      summoner,
      masteries: List.empty,
      championShards: Maybe.none,
    })

    expectT(
      pipe(
        SummonerMasteriesView.Lens.championShards.counts,
        optional.modify(Dict.upsertAt('b', 2)),
      )({
        summoner,
        masteries: List.empty,
        championShards: Maybe.some({
          counts: { a: 1 },
          leveledUpFromNotifications: Maybe.none,
        }),
      }),
    ).toStrictEqual({
      summoner,
      masteries: List.empty,
      championShards: Maybe.some({
        counts: { a: 1, b: 2 },
        leveledUpFromNotifications: Maybe.none,
      }),
    })
  })
})
