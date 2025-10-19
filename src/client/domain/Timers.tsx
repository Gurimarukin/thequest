/* eslint-disable functional/no-expression-statements,
                  functional/no-return-void */
import { flow, pipe } from 'fp-ts/function'
import { useCallback, useId, useMemo, useRef, useState } from 'react'

import { apiRoutes } from '../../shared/ApiRouter'
import { ItemId } from '../../shared/models/api/ItemId'
import type { ChampionPosition } from '../../shared/models/api/champion/ChampionPosition'
import { RuneId } from '../../shared/models/api/perk/RuneId'
import { AdditionalStaticData } from '../../shared/models/api/staticData/AdditionalStaticData'
import type { StaticDataItem } from '../../shared/models/api/staticData/StaticDataItem'
import type { StaticDataSummonerSpell } from '../../shared/models/api/staticData/StaticDataSummonerSpell'
import { SummonerSpellKey } from '../../shared/models/api/summonerSpell/SummonerSpellKey'
import { DictUtils } from '../../shared/utils/DictUtils'
import { ListUtils } from '../../shared/utils/ListUtils'
import type { Dict } from '../../shared/utils/fp'
import { List, Maybe, Tuple } from '../../shared/utils/fp'

import { AsyncRenderer } from '../components/AsyncRenderer'
import { ChampionPositionImg } from '../components/ChampionPositionImg'
import { Loading } from '../components/Loading'
import { Navigate } from '../components/Navigate'
import { Rune } from '../components/Rune'
import { SummonerSpell } from '../components/SummonerSpell'
import { MainLayout } from '../components/mainLayout/MainLayout'
import { Tooltip } from '../components/tooltip/Tooltip'
import { useStaticData } from '../contexts/StaticDataContext'
import { useTranslation } from '../contexts/TranslationContext'
import { useUser } from '../contexts/UserContext'
import { useSWRHttp } from '../hooks/useSWRHttp'
import { appRoutes } from '../router/AppRouter'
import { cx } from '../utils/cx'

// [id, summonerSpellHaste]
const cosmicInsight = Tuple.of(RuneId(8347), 18)
const ionianBootsOfLucidity = Tuple.of(ItemId(3158), 10)

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

export const Timers: React.FC = () => {
  const { user } = useUser()

  if (user.type === 'Loading') {
    return <Loading className="my-2 h-5" />
  }

  if (user.type === 'Success' && Maybe.isSome(user.loadedValue)) {
    return <AllowedTimers />
  }

  // TODO: not found
  return <Navigate to={appRoutes.index} replace={true} />
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
          <Position
            key={position}
            position={position}
            spells={spells}
            summonerSpellByKey={summonerSpellByKey}
            summonerSpellHaste={[
              pipe(
                pipe(
                  additionalStaticData.runes,
                  ListUtils.findFirstBy(RuneId.Eq)(r => r.id),
                )(cosmicInsight[0]),
                Maybe.map(r =>
                  Tuple.of(
                    <Rune
                      icon={r.iconPath}
                      name={r.name}
                      description={r.longDesc}
                      className="w-full"
                    />,
                    cosmicInsight[1],
                  ),
                ),
              ),
              pipe(
                pipe(
                  additionalStaticData.items,
                  ListUtils.findFirstBy(ItemId.Eq)(i => i.id),
                )(ionianBootsOfLucidity[0]),
                Maybe.map(item => Tuple.of(<Item item={item} />, ionianBootsOfLucidity[1])),
              ),
            ]}
          />
        ))}
      </ul>
    </div>
  )
}

type PositionProps = {
  position: ChampionPosition
  spells: ReadonlySet<SummonerSpellKey>
  summonerSpellByKey: (key: SummonerSpellKey) => Maybe<StaticDataSummonerSpell>
  summonerSpellHaste: List<Maybe<Tuple<React.ReactNode, number>>>
}

const Position: React.FC<PositionProps> = ({
  position,
  spells,
  summonerSpellByKey,
  summonerSpellHaste,
}) => {
  const [totalHaste, setTotalHaste] = useState(0)

  const onToggleHaste = useCallback((addHaste: number) => setTotalHaste(h => h + addHaste), [])

  return (
    <li className="flex items-center gap-5">
      <ul className="flex gap-2">
        {pipe(
          summonerSpellHaste,
          List.filterMapWithIndex((i, h) =>
            pipe(
              h,
              Maybe.map(([children, haste]) => (
                <HasteBonus key={i} haste={haste} onToggle={onToggleHaste}>
                  {children}
                </HasteBonus>
              )),
            ),
          ),
        )}
      </ul>

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

type HasteBonusProps = {
  haste: number
  onToggle: (addHaste: number) => void
  children?: React.ReactNode
}

const HasteBonus: React.FC<HasteBonusProps> = ({ haste, onToggle, children }) => {
  const [checked, setChecked] = useState(false)

  const handleToggle = useCallback(() => {
    if (checked) {
      onToggle(-haste)
      setChecked(false)
    } else {
      onToggle(haste)
      setChecked(true)
    }
  }, [checked, haste, onToggle])

  const id = useId()

  return (
    <li className="flex">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={handleToggle}
        className="sr-only"
      />

      <label htmlFor={id} className="relative flex w-10 cursor-pointer overflow-hidden bg-black">
        <span className={cx(['opacity-60', !checked])}>{children}</span>

        {!checked && (
          <span className="absolute top-[calc(100%_-_0.125rem)] w-20 origin-left -rotate-45 border-t-4 border-red-ban shadow-even shadow-black" />
        )}
      </label>
    </li>
  )
}

type ItemProps = {
  item: StaticDataItem
}

const Item: React.FC<ItemProps> = ({ item }) => {
  const { assets } = useStaticData()

  const ref = useRef<HTMLImageElement>(null)

  return (
    <>
      <img ref={ref} src={assets.item(item.id)} alt={item.name} className="w-full" />

      <Tooltip hoverRef={ref} className="flex max-w-xs flex-col gap-1">
        <span className="font-bold">{item.name}</span>
        <span className="whitespace-break-spaces">{item.plaintext}</span>
        <span
          dangerouslySetInnerHTML={{ __html: item.description }}
          className="whitespace-normal"
        />
      </Tooltip>
    </>
  )
}
