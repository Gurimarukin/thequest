import { flow, pipe } from 'fp-ts/function'
import React, { createContext, useContext } from 'react'

import { apiRoutes } from '../../shared/ApiRouter'
import type { ChampionKey } from '../../shared/models/api/ChampionKey'
import type { Lang } from '../../shared/models/api/Lang'
import { StaticData } from '../../shared/models/api/StaticData'
import type { StaticDataChampion } from '../../shared/models/api/StaticDataChampion'
import { DDragonUtils } from '../../shared/utils/DDragonUtils'
import { List, Maybe } from '../../shared/utils/fp'

import { useSWRHttp } from '../hooks/useSWRHttp'
import { basicAsyncRenderer } from '../utils/basicAsyncRenderer'

const { ddragonCdn } = DDragonUtils

const lang: Lang = 'fr_FR' // TODO: based on browser

type DDragonContext = {
  readonly assets: {
    readonly summonerIcon: (iconId: number) => string
    readonly champion: {
      readonly square: (champion: ChampionKey) => string
    }
  }
}

const DDragonContext = createContext<DDragonContext | undefined>(undefined)

export const DDragonContextProvider: React.FC = ({ children }) =>
  basicAsyncRenderer(
    useSWRHttp(apiRoutes.staticData.lang.get(lang), {}, [StaticData.codec, 'StaticData'], {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }),
  )(({ version, champions }) => {
    const findChamp = (champion: ChampionKey): Maybe<StaticDataChampion> =>
      pipe(
        champions,
        List.findFirst(c => c.key === champion),
      )

    const value: DDragonContext = {
      assets: {
        summonerIcon: iconId => ddragonCdn(version, `/img/profileicon/${iconId}.png`),

        champion: {
          square: flow(
            findChamp,
            Maybe.map(c => c.id),
            Maybe.toNullable,
            name => ddragonCdn(version, `/img/champion/${name}.png`),
          ),
        },
      },
    }

    return <DDragonContext.Provider value={value}>{children}</DDragonContext.Provider>
  })

export const useDDragon = (): DDragonContext => {
  const context = useContext(DDragonContext)
  if (context === undefined) {
    // eslint-disable-next-line functional/no-throw-statement
    throw Error('useDDragon must be used within a DDragonContextProvider')
  }
  return context
}
