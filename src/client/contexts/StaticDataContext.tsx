import { flow, pipe } from 'fp-ts/function'
import { createContext, useContext } from 'react'

import { apiRoutes } from '../../shared/ApiRouter'
import { Lang } from '../../shared/models/api/Lang'
import type { ChampionKey } from '../../shared/models/api/champion/ChampionKey'
import { StaticData } from '../../shared/models/api/staticData/StaticData'
import type { StaticDataChampion } from '../../shared/models/api/staticData/StaticDataChampion'
import type { SummonerSpellId } from '../../shared/models/api/summonerSpell/SummonerSpellId'
import { DDragonUtils } from '../../shared/utils/DDragonUtils'
import { List, Maybe } from '../../shared/utils/fp'

import { useSWRHttp } from '../hooks/useSWRHttp'
import type { ChildrenFC } from '../models/ChildrenFC'
import { basicAsyncRenderer } from '../utils/basicAsyncRenderer'

const { ddragonCdn } = DDragonUtils

const lang: Lang = Lang.defaultLang // TODO: based on browser

export type StaticDataContext = {
  lang: Lang
  champions: List<StaticDataChampion>
  assets: {
    champion: {
      square: (champion: ChampionKey) => string
    }
    summonerIcon: (iconId: number) => string
    summonerSpell: (spell: SummonerSpellId) => string
  }
}

const StaticDataContext = createContext<StaticDataContext | undefined>(undefined)

export const StaticDataContextProvider: ChildrenFC = ({ children }) =>
  basicAsyncRenderer(
    useSWRHttp(apiRoutes.staticData.lang(lang).get, {}, [StaticData.codec, 'StaticData'], {
      revalidateIfStale: false,
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
      lang,
      champions,
      assets: {
        champion: {
          square: flow(
            findChampionByKey,
            Maybe.map(c => c.id),
            Maybe.toNullable,
            name => ddragonCdn(version, `/img/champion/${name}.png`),
          ),
        },
        summonerIcon: iconId => ddragonCdn(version, `/img/profileicon/${iconId}.png`),
        summonerSpell: spellId => ddragonCdn(version, `/img/spell/${spellId}.png`),
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
