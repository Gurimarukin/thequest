/* eslint-disable functional/no-expression-statements */
import { flow, pipe } from 'fp-ts/function'
import * as D from 'io-ts/Decoder'
import { createContext, useContext, useEffect, useMemo } from 'react'

import { apiRoutes } from '../../shared/ApiRouter'
import { ValidatedSoft } from '../../shared/models/ValidatedSoft'
import type { ItemId } from '../../shared/models/api/ItemId'
import { ChampionKey } from '../../shared/models/api/champion/ChampionKey'
import { StaticData } from '../../shared/models/api/staticData/StaticData'
import type { StaticDataChampion } from '../../shared/models/api/staticData/StaticDataChampion'
import type { SummonerSpellId } from '../../shared/models/api/summonerSpell/SummonerSpellId'
import { DDragonUtils } from '../../shared/utils/DDragonUtils'
import { ListUtils } from '../../shared/utils/ListUtils'
import { List, Maybe } from '../../shared/utils/fp'

import { AsyncRenderer } from '../components/AsyncRenderer'
import { useSWRHttp } from '../hooks/useSWRHttp'
import type { ChildrenFC } from '../models/ChildrenFC'
import { useToaster } from './ToasterContext'
import { useTranslation } from './TranslationContext'

const { ddragonCdn } = DDragonUtils

export type StaticDataContext = {
  champions: List<StaticDataChampion>
  championByKey: (key: ChampionKey) => Maybe<StaticDataChampion>
  assets: {
    champion: {
      square: (champion: ChampionKey) => string
    }
    summonerIcon: (iconId: number) => string
    summonerSpell: (spellId: SummonerSpellId) => string
    item: (itemId: ItemId) => string
  }
}

const StaticDataContext = createContext<StaticDataContext | undefined>(undefined)

export const StaticDataContextProvider: ChildrenFC = ({ children }) => {
  const { lang } = useTranslation()

  return (
    <AsyncRenderer
      {...useSWRHttp(
        apiRoutes.staticData(lang).get,
        {},
        [ValidatedSoft.decoder(StaticData.codec, D.string), 'StaticData'],
        {
          revalidateIfStale: false,
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
        },
      )}
    >
      {data => <StaticDataLoaded data={data}>{children}</StaticDataLoaded>}
    </AsyncRenderer>
  )
}

type StaticDataContextProviderLoaderProps = {
  data: ValidatedSoft<StaticData, string>
  children?: React.ReactNode
}

const StaticDataLoaded: React.FC<StaticDataContextProviderLoaderProps> = ({ data, children }) => {
  const { version, champions } = data.value

  const { showToaster } = useToaster()

  useEffect(() => {
    if (List.isNonEmpty(data.errors)) {
      console.warn(List.mkString('Static data errors:\n- ', '\n- ', '')(data.errors))

      showToaster('warn', 'Static data warning')
    }
  }, [data.errors, showToaster])

  const championByKey = useMemo(
    (): ((key: ChampionKey) => Maybe<StaticDataChampion>) =>
      pipe(
        champions,
        ListUtils.findFirstBy(ChampionKey.Eq)(c => c.key),
      ),
    [champions],
  )

  const value: StaticDataContext = {
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
      item: itemId => ddragonCdn(version, `/img/item/${itemId}.png`),
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
