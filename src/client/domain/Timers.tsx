import { flow, pipe } from 'fp-ts/function'
import { useCallback, useMemo, useState } from 'react'

import { apiRoutes } from '../../shared/ApiRouter'
import { ItemId } from '../../shared/models/api/ItemId'
import type { ChampionPosition } from '../../shared/models/api/champion/ChampionPosition'
import { RuneId } from '../../shared/models/api/perk/RuneId'
import { AdditionalStaticData } from '../../shared/models/api/staticData/AdditionalStaticData'
import type { StaticDataItem } from '../../shared/models/api/staticData/StaticDataItem'
import type { StaticDataRune } from '../../shared/models/api/staticData/StaticDataRune'
import type { StaticDataSummonerSpell } from '../../shared/models/api/staticData/StaticDataSummonerSpell'
import { SummonerSpellKey } from '../../shared/models/api/summonerSpell/SummonerSpellKey'
import { DictUtils } from '../../shared/utils/DictUtils'
import { ListUtils } from '../../shared/utils/ListUtils'
import type { Dict } from '../../shared/utils/fp'
import { List, Maybe } from '../../shared/utils/fp'

import { AsyncRenderer } from '../components/AsyncRenderer'
import { ChampionPositionImg } from '../components/ChampionPositionImg'
import { HasteBonuses } from '../components/HasteBonuses'
import { SummonerSpell } from '../components/SummonerSpell'
import { MainLayout } from '../components/mainLayout/MainLayout'
import { useTranslation } from '../contexts/TranslationContext'
import { useSWRHttp } from '../hooks/useSWRHttp'

const cleanse = SummonerSpellKey(1)
const exhaust = SummonerSpellKey(3)
const flash = SummonerSpellKey(4)
const ghost = SummonerSpellKey(6)
const heal = SummonerSpellKey(7)
const smite = SummonerSpellKey(11)
const teleport = SummonerSpellKey(12)
const ignite = SummonerSpellKey(14)
const barrier = SummonerSpellKey(21)

const all = new Set([flash, teleport, ignite, barrier, heal, ghost, exhaust, cleanse])

const spellsByPosition: Dict<ChampionPosition, ReadonlySet<SummonerSpellKey>> = {
  top: all,
  jun: new Set([...all, smite]),
  mid: all,
  bot: all,
  sup: all,
}

export const Timers: React.FC = () => {
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

  const runeById = useMemo(
    (): ((id: RuneId) => Maybe<StaticDataRune>) =>
      pipe(
        additionalStaticData.runes,
        ListUtils.findFirstBy(RuneId.Eq)(r => r.id),
      ),
    [additionalStaticData.runes],
  )

  const itemById = useMemo(
    (): ((id: ItemId) => Maybe<StaticDataItem>) =>
      pipe(
        additionalStaticData.items,
        ListUtils.findFirstBy(ItemId.Eq)(i => i.id),
      ),
    [additionalStaticData.items],
  )

  return (
    <div className="grid min-h-full place-items-center">
      <ul className="flex flex-col gap-5">
        {DictUtils.entries(spellsByPosition).map(([position, spells]) => (
          <Position
            key={position}
            runeById={runeById}
            itemById={itemById}
            position={position}
            spells={spells}
            summonerSpellByKey={summonerSpellByKey}
          />
        ))}
      </ul>
    </div>
  )
}

type PositionProps = {
  runeById: (id: RuneId) => Maybe<StaticDataRune>
  itemById: (id: ItemId) => Maybe<StaticDataItem>
  position: ChampionPosition
  spells: ReadonlySet<SummonerSpellKey>
  summonerSpellByKey: (key: SummonerSpellKey) => Maybe<StaticDataSummonerSpell>
}

const Position: React.FC<PositionProps> = ({
  runeById,
  itemById,
  position,
  spells,
  summonerSpellByKey,
}) => {
  const [totalHaste, setTotalHaste] = useState(0)

  const onToggleHaste = useCallback((addHaste: number) => setTotalHaste(h => h + addHaste), [])

  return (
    <li className="flex items-center gap-5">
      <HasteBonuses runeById={runeById} itemById={itemById} onToggle={onToggleHaste} />

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
                    haste={totalHaste}
                    className="w-16 overflow-hidden rounded-lg"
                    timerClassName="text-2xl bg-black/60"
                  />
                </li>
              )),
            ),
          ),
        )}
      </ul>
    </li>
  )
}
