import { flow, pipe } from 'fp-ts/function'
import { createContext, useContext, useMemo } from 'react'

import { apiRoutes } from '../../shared/ApiRouter'
import { Lang } from '../../shared/models/api/Lang'
import { ChampionKey } from '../../shared/models/api/champion/ChampionKey'
import { StaticData } from '../../shared/models/api/staticData/StaticData'
import type { StaticDataChampion } from '../../shared/models/api/staticData/StaticDataChampion'
import type { SummonerSpellId } from '../../shared/models/api/summonerSpell/SummonerSpellId'
import { DDragonUtils } from '../../shared/utils/DDragonUtils'
import { ListUtils } from '../../shared/utils/ListUtils'
import type { List } from '../../shared/utils/fp'
import { Maybe } from '../../shared/utils/fp'

import { useSWRHttp } from '../hooks/useSWRHttp'
import type { ChildrenFC } from '../models/ChildrenFC'
import { basicAsyncRenderer } from '../utils/basicAsyncRenderer'

const { ddragonCdn } = DDragonUtils

const lang: Lang = Lang.defaultLang // TODO: based on browser

export type StaticDataContext = {
  lang: Lang
  champions: List<StaticDataChampion>
  championByKey: (key: ChampionKey) => Maybe<StaticDataChampion>
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
  )(data => (
    <StaticDataContextProviderLoader data={data}>{children}</StaticDataContextProviderLoader>
  ))

type StaticDataContextProviderLoaderProps = {
  data: StaticData
  children?: React.ReactNode
}

const StaticDataContextProviderLoader: React.FC<StaticDataContextProviderLoaderProps> = ({
  data: { version, champions },
  children,
}) => {
  const championByKey = useMemo(
    (): ((key: ChampionKey) => Maybe<StaticDataChampion>) =>
      pipe(
        champions,
        ListUtils.findFirstBy(ChampionKey.Eq)(c => c.key),
      ),
    [champions],
  )

  const value: StaticDataContext = {
    lang,
    champions,
    championByKey,
    assets: {
      champion: {
        square: flow(
          championByKey,
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
}

export const useStaticData = (): StaticDataContext => {
  const context = useContext(StaticDataContext)
  if (context === undefined) {
    // eslint-disable-next-line functional/no-throw-statements
    throw Error('useStaticData must be used within a StaticDataContextProvider')
  }
  return context
}
