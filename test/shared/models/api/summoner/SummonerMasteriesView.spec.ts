import { pipe } from 'fp-ts/function'
import { optional } from 'monocle-ts'

import { DayJs } from '../../../../../src/shared/models/DayJs'
import { MsDuration } from '../../../../../src/shared/models/MsDuration'
import type { ChampionKey } from '../../../../../src/shared/models/api/champion/ChampionKey'
import { ChampionShardsView } from '../../../../../src/shared/models/api/summoner/ChampionShardsView'
import { Puuid } from '../../../../../src/shared/models/api/summoner/Puuid'
import { SummonerMasteriesView } from '../../../../../src/shared/models/api/summoner/SummonerMasteriesView'
import type { SummonerView } from '../../../../../src/shared/models/api/summoner/SummonerView'
import { GameName } from '../../../../../src/shared/models/riot/GameName'
import { RiotId } from '../../../../../src/shared/models/riot/RiotId'
import { SummonerName } from '../../../../../src/shared/models/riot/SummonerName'
import { TagLine } from '../../../../../src/shared/models/riot/TagLine'
import { ListUtils } from '../../../../../src/shared/utils/ListUtils'
import { Maybe } from '../../../../../src/shared/utils/fp'

import { expectT } from '../../../../expectT'

describe('SummonerMasteriesView.Lens.championShards.counts', () => {
  it('should lens', () => {
    const summoner: SummonerView = {
      puuid: Puuid(''),
      riotId: RiotId(GameName(''), TagLine('')),
      name: Maybe.some(SummonerName('')),
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

    const emptyLeagues: SummonerMasteriesView['leagues'] = {
      soloDuo: { currentSplit: Maybe.none, previousSplit: Maybe.none },
      flex: { currentSplit: Maybe.none, previousSplit: Maybe.none },
    }

    expectT(
      pipe(
        SummonerMasteriesView.Lens.championShards,
        optional.modify(ListUtils.updateOrAppend(ChampionShardsView.Eq.byChampion)(shardsOne)),
      )({
        summoner,
        leagues: emptyLeagues,
        masteries: {
          champions: [],
          insertedAt: DayJs.of(0),
          cacheDuration: MsDuration.milliseconds(0),
        },
        championShards: Maybe.none,
      }),
    ).toStrictEqual({
      summoner,
      leagues: emptyLeagues,
      masteries: {
        champions: [],
        insertedAt: DayJs.of(0),
        cacheDuration: MsDuration.milliseconds(0),
      },
      championShards: Maybe.none,
    })

    expectT(
      pipe(
        SummonerMasteriesView.Lens.championShards,
        optional.modify(ListUtils.updateOrAppend(ChampionShardsView.Eq.byChampion)(shardsTwo)),
      )({
        summoner,
        leagues: emptyLeagues,
        masteries: {
          champions: [],
          insertedAt: DayJs.of(0),
          cacheDuration: MsDuration.milliseconds(0),
        },
        championShards: Maybe.some([shardsOne]),
      }),
    ).toStrictEqual({
      summoner,
      leagues: emptyLeagues,
      masteries: {
        champions: [],
        insertedAt: DayJs.of(0),
        cacheDuration: MsDuration.milliseconds(0),
      },
      championShards: Maybe.some([shardsOne, shardsTwo]),
    })

    expectT(
      pipe(
        SummonerMasteriesView.Lens.championShards,
        optional.modify(ListUtils.updateOrAppend(ChampionShardsView.Eq.byChampion)(shardsOneBis)),
      )({
        summoner,
        leagues: emptyLeagues,
        masteries: {
          champions: [],
          insertedAt: DayJs.of(0),
          cacheDuration: MsDuration.milliseconds(0),
        },
        championShards: Maybe.some([shardsOne, shardsTwo]),
      }),
    ).toStrictEqual({
      summoner,
      leagues: emptyLeagues,
      masteries: {
        champions: [],
        insertedAt: DayJs.of(0),
        cacheDuration: MsDuration.milliseconds(0),
      },
      championShards: Maybe.some([shardsOneBis, shardsTwo]),
    })
  })
})
