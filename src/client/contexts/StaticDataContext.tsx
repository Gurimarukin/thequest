import { flow, pipe } from 'fp-ts/function'
import React, { createContext, useContext } from 'react'

import { apiRoutes } from '../../shared/ApiRouter'
import type { ChampionKey } from '../../shared/models/api/ChampionKey'
import { Lang } from '../../shared/models/api/Lang'
import { StaticData } from '../../shared/models/api/StaticData'
import type { StaticDataChampion } from '../../shared/models/api/StaticDataChampion'
import { DDragonUtils } from '../../shared/utils/DDragonUtils'
import { List, Maybe } from '../../shared/utils/fp'

import { useSWRHttp } from '../hooks/useSWRHttp'
import { basicAsyncRenderer } from '../utils/basicAsyncRenderer'

const { ddragonCdn } = DDragonUtils

const lang: Lang = Lang.defaultLang // TODO: based on browser

export type StaticDataContext = {
  champions: List<StaticDataChampion>
  assets: {
    summonerIcon: (iconId: number) => string
    champion: {
      square: (champion: ChampionKey) => string
    }
  }
}

const StaticDataContext = createContext<StaticDataContext | undefined>(undefined)

export const StaticDataContextProvider: React.FC = ({ children }) =>
  basicAsyncRenderer(
    useSWRHttp(apiRoutes.staticData.lang.get(lang), {}, [StaticData.codec, 'StaticData'], {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }),
  )(({ version, champions }) => {
    const findChampionByKey = (champion: ChampionKey): Maybe<StaticDataChampion> =>
      pipe(
        champions,
        List.findFirst(c => c.key === champion),
      )

    const value: StaticDataContext = {
      champions,
      assets: {
        summonerIcon: iconId => ddragonCdn(version, `/img/profileicon/${iconId}.png`),

        champion: {
          square: flow(
            findChampionByKey,
            Maybe.map(c => c.id),
            Maybe.toNullable,
            name => ddragonCdn(version, `/img/champion/${name}.png`),
          ),
        },
      },
    }

    return <StaticDataContext.Provider value={value}>{children}</StaticDataContext.Provider>
  })

export const useStaticData = (): StaticDataContext => {
  const context = useContext(StaticDataContext)
  if (context === undefined) {
    // eslint-disable-next-line functional/no-throw-statements
    throw Error('useStaticData must be used within a StaticDataContextProvider')
  }
  return context
}
