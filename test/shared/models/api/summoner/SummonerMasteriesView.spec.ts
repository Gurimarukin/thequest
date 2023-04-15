import { pipe } from 'fp-ts/function'
import { optional } from 'monocle-ts'

import type { ChampionKey } from '../../../../../src/shared/models/api/champion/ChampionKey'
import { ChampionShardsView } from '../../../../../src/shared/models/api/summoner/ChampionShardsView'
import { SummonerMasteriesView } from '../../../../../src/shared/models/api/summoner/SummonerMasteriesView'
import type { SummonerView } from '../../../../../src/shared/models/api/summoner/SummonerView'
import { ListUtils } from '../../../../../src/shared/utils/ListUtils'
import { List, Maybe } from '../../../../../src/shared/utils/fp'

import { expectT } from '../../../../expectT'

describe('SummonerMasteriesView.Lens.championShards.counts', () => {
  it('should lens', () => {
    const summoner: SummonerView = {
      name: '',
      profileIconId: 0,
      summonerLevel: 0,
    }

    const shardsOne: ChampionShardsView = {
      champion: 1 as unknown as ChampionKey,
      count: 1,
      shardsToRemoveFromNotification: Maybe.none,
    }

    const shardsOneBis: ChampionShardsView = {
      champion: 1 as unknown as ChampionKey,
      count: 2,
      shardsToRemoveFromNotification: Maybe.none,
    }

    const shardsTwo: ChampionShardsView = {
      champion: 2 as unknown as ChampionKey,
      count: 1,
      shardsToRemoveFromNotification: Maybe.none,
    }

    expectT(
      pipe(
        SummonerMasteriesView.Lens.championShards,
        optional.modify(ListUtils.updateOrAppend(ChampionShardsView.Eq.byChampion)(shardsOne)),
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
        SummonerMasteriesView.Lens.championShards,
        optional.modify(ListUtils.updateOrAppend(ChampionShardsView.Eq.byChampion)(shardsTwo)),
      )({
        summoner,
        masteries: List.empty,
        championShards: Maybe.some([shardsOne]),
      }),
    ).toStrictEqual({
      summoner,
      masteries: List.empty,
      championShards: Maybe.some([shardsOne, shardsTwo]),
    })

    expectT(
      pipe(
        SummonerMasteriesView.Lens.championShards,
        optional.modify(ListUtils.updateOrAppend(ChampionShardsView.Eq.byChampion)(shardsOneBis)),
      )({
        summoner,
        masteries: List.empty,
        championShards: Maybe.some([shardsOne, shardsTwo]),
      }),
    ).toStrictEqual({
      summoner,
      masteries: List.empty,
      championShards: Maybe.some([shardsOneBis, shardsTwo]),
    })
  })
})
