import { flow, pipe } from 'fp-ts/function'
import { useMemo } from 'react'

import { apiRoutes } from '../../shared/ApiRouter'
import type { ChampionPosition } from '../../shared/models/api/champion/ChampionPosition'
import { AdditionalStaticData } from '../../shared/models/api/staticData/AdditionalStaticData'
import type { StaticDataSummonerSpell } from '../../shared/models/api/staticData/StaticDataSummonerSpell'
import { SummonerSpellKey } from '../../shared/models/api/summonerSpell/SummonerSpellKey'
import { DictUtils } from '../../shared/utils/DictUtils'
import { ListUtils } from '../../shared/utils/ListUtils'
import type { Dict } from '../../shared/utils/fp'
import { List, Maybe } from '../../shared/utils/fp'

import { AsyncRenderer } from '../components/AsyncRenderer'
import { ChampionPositionImg } from '../components/ChampionPositionImg'
import { Navigate } from '../components/Navigate'
import { SummonerSpell } from '../components/SummonerSpell'
import { MainLayout } from '../components/mainLayout/MainLayout'
import { useTranslation } from '../contexts/TranslationContext'
import { useUser } from '../contexts/UserContext'
import { useSWRHttp } from '../hooks/useSWRHttp'
import { appRoutes } from '../router/AppRouter'

export const Timers: React.FC = () => {
  const { maybeUser } = useUser()

  if (Maybe.isNone(maybeUser)) {
    // TODO: not found
    return <Navigate to={appRoutes.index} replace={true} />
  }

  return <AllowedTimers />
}

const AllowedTimers: React.FC = () => {
  const { lang } = useTranslation()

  return (
    <MainLayout>
      <AsyncRenderer
        {...useSWRHttp(apiRoutes.staticData(lang).additional.get, {}, [
          AdditionalStaticData.codec,
          'AdditionalStaticData',
        ])}
      >
        {additionalStaticData => <Loaded additionalStaticData={additionalStaticData} />}
      </AsyncRenderer>
    </MainLayout>
  )
}

type LoadedProps = {
  additionalStaticData: AdditionalStaticData
}

const Loaded: React.FC<LoadedProps> = ({ additionalStaticData }) => {
  const summonerSpellByKey = useMemo(
    (): ((key: SummonerSpellKey) => Maybe<StaticDataSummonerSpell>) =>
      pipe(
        additionalStaticData.summonerSpells,
        ListUtils.findFirstBy(SummonerSpellKey.Eq)(s => s.key),
      ),
    [additionalStaticData.summonerSpells],
  )

  return (
    <div className="grid min-h-full place-items-center">
      <ul className="flex flex-col gap-5">
        {DictUtils.entries(spellsByPosition).map(([position, spells]) => (
          <li key={position} className="flex items-center gap-5">
            <ChampionPositionImg position={position} className="size-12" />

            <ul className="flex gap-3">
              {pipe(
                Array.from(spells),
                List.filterMap(
                  flow(
                    summonerSpellByKey,
                    Maybe.map(spell => (
                      <li key={SummonerSpellKey.unwrap(spell.key)}>
                        <SummonerSpell
                          spell={spell}
                          className="size-16 overflow-hidden rounded-lg"
                          timerClassName="text-2xl bg-black/60"
                        />
                      </li>
                    )),
                  ),
                ),
              )}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  )
}

const cleanse = SummonerSpellKey(1)
const exhaust = SummonerSpellKey(3)
const flash = SummonerSpellKey(4)
const ghost = SummonerSpellKey(6)
const heal = SummonerSpellKey(7)
const smite = SummonerSpellKey(11)
const teleport = SummonerSpellKey(12)
const ignite = SummonerSpellKey(14)
const barrier = SummonerSpellKey(21)

const spellsByPosition: Dict<ChampionPosition, ReadonlySet<SummonerSpellKey>> = {
  top: new Set([flash, teleport, ignite, ghost, exhaust]),
  jun: new Set([flash, smite, ignite, ghost, exhaust, teleport]),
  mid: new Set([flash, teleport, ignite, barrier, ghost, exhaust, cleanse]),
  bot: new Set([flash, barrier, cleanse, teleport, heal, exhaust]),
  sup: new Set([flash, heal, ignite, exhaust]),
}
