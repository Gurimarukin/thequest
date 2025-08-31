/* eslint-disable functional/no-expression-statements,
                  functional/no-return-void */
import { ord, readonlySet } from 'fp-ts'
import type { Endomorphism } from 'fp-ts/Endomorphism'
import { flow, pipe } from 'fp-ts/function'
import { lens } from 'monocle-ts'
import type React from 'react'
import { useCallback, useMemo, useRef, useState } from 'react'

import { ChampionFactionOrNone } from '../../../../shared/models/api/champion/ChampionFaction'
import { ChampionLevel } from '../../../../shared/models/api/champion/ChampionLevel'
import { ChampionPosition } from '../../../../shared/models/api/champion/ChampionPosition'
import type { Dict, Maybe } from '../../../../shared/utils/fp'
import { List, NonEmptyArray } from '../../../../shared/utils/fp'

import { ChampionFactionImg } from '../../../components/ChampionFactionImg'
import { ChampionPositionImg } from '../../../components/ChampionPositionImg'
import { MaskedImage } from '../../../components/MaskedImage'
import { MasteryImg } from '../../../components/MasteryImg'
import { Radios, labelValue } from '../../../components/Radios'
import { SearchChampion } from '../../../components/SearchChampion'
import { Tooltip } from '../../../components/tooltip/Tooltip'
import { useHistory } from '../../../contexts/HistoryContext'
import { useTranslation } from '../../../contexts/TranslationContext'
import { Assets } from '../../../imgs/Assets'
import { HowlingAbyssSimple } from '../../../imgs/svgs/HowlingAbyss'
import type { SVGIcon } from '../../../imgs/svgs/SVGIcon'
import {
  AppsSharp,
  CaretDownOutline,
  CaretUpOutline,
  CircleOffOutline,
  StatsChartSharp,
} from '../../../imgs/svgs/icons'
import { MasteriesQuery } from '../../../models/masteriesQuery/MasteriesQuery'
import { MasteriesQueryOrder } from '../../../models/masteriesQuery/MasteriesQueryOrder'
import { MasteriesQuerySort } from '../../../models/masteriesQuery/MasteriesQuerySort'
import type { MasteriesQueryView } from '../../../models/masteriesQuery/MasteriesQueryView'
import { cx } from '../../../utils/cx'
import { Checkboxes } from './Checkboxes'

type Props = {
  searchCount: number
  randomChampion: Maybe<() => string>
}

export const MasteriesFilters: React.FC<Props> = ({ searchCount, randomChampion }) => {
  const { t } = useTranslation()

  const { masteriesQuery, updateMasteriesQuery } = useHistory()

  const [levelsMenuIsVisible, setLevelsMenuIsVisible] = useState(false)
  const handleMasteriesMouseEnter = useCallback(() => {
    if (!levelsMenuIsVisible) setLevelsMenuIsVisible(true)
  }, [levelsMenuIsVisible])
  const hideLevelsMenu = useCallback(() => setLevelsMenuIsVisible(false), [])

  const toggleMasteryChecked = useCallback(
    (f: Endomorphism<ReadonlySet<ChampionLevel>>): void => {
      updateMasteriesQuery(pipe(MasteriesQuery.Lens.level, lens.modify(f)))
      hideLevelsMenu()
    },
    [hideLevelsMenu, updateMasteriesQuery],
  )

  const SelectLevelsButton = useMemo(
    () =>
      getSelectLevelsButton(
        masteriesQuery.level,
        flow(MasteriesQuery.Lens.level.set, updateMasteriesQuery, hideLevelsMenu),
      ),
    [hideLevelsMenu, masteriesQuery.level, updateMasteriesQuery],
  )

  const toggleFactionChecked = useCallback(
    (f: Endomorphism<ReadonlySet<ChampionFactionOrNone>>): void =>
      updateMasteriesQuery(pipe(MasteriesQuery.Lens.faction, lens.modify(f))),
    [updateMasteriesQuery],
  )

  const togglePositionChecked = useCallback(
    (f: Endomorphism<ReadonlySet<ChampionPosition>>): void =>
      updateMasteriesQuery(pipe(MasteriesQuery.Lens.position, lens.modify(f))),
    [updateMasteriesQuery],
  )

  const setSort = flow(MasteriesQuery.Lens.sort.set, updateMasteriesQuery)
  const setOrder = flow(MasteriesQuery.Lens.order.set, updateMasteriesQuery)
  const setView = flow(MasteriesQuery.Lens.view.set, updateMasteriesQuery)

  const setQuerySearch = useMemo(
    (): ((search_: Maybe<string>) => void) =>
      flow(MasteriesQuery.Lens.search.set, updateMasteriesQuery),
    [updateMasteriesQuery],
  )

  return (
    <div className="flex w-full max-w-7xl flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Radios<MasteriesQueryView> name="view" value={masteriesQuery.view} setValue={setView}>
          {labelValue(
            'compact',
            <IconLabel tooltip={t.masteries.filters.view.compact} className="px-1.5">
              <AppsSharp className="w-4" />
              <span>{t.masteries.filters.viewShort.compact}</span>
            </IconLabel>,
          )}
          {labelValue(
            'histogram',
            <IconLabel tooltip={t.masteries.filters.view.histogram} className="px-1.5">
              <StatsChartSharp className="w-5 rotate-90 -scale-x-100" />
              <span>{t.masteries.filters.viewShort.histogram}</span>
            </IconLabel>,
          )}
          {labelValue(
            'aram',
            <IconLabel tooltip={t.masteries.filters.view.aram} className="px-1.5">
              <HowlingAbyssSimple className="w-[18px]" />
              <span>{t.masteries.filters.viewShort.aram}</span>
            </IconLabel>,
          )}
          {labelValue(
            'urf',
            <IconLabel tooltip={t.masteries.filters.view.urf} className="px-1.5">
              <MaskedImage src={Assets.spatula} className="size-[18px]" />
              <span>{t.masteries.filters.viewShort.urf}</span>
            </IconLabel>,
          )}
          {labelValue(
            'factions',
            <IconLabel tooltip={t.masteries.filters.view.factions} className="px-1.5">
              <MaskedImage src={Assets.runeterra} className="size-[18px]" />
              <span>{t.masteries.filters.viewShort.factions}</span>
            </IconLabel>,
          )}
        </Radios>

        <div className="flex flex-wrap items-center gap-3">
          <Radios<MasteriesQuerySort> name="sort" value={masteriesQuery.sort} setValue={setSort}>
            {pipe(
              MasteriesQuerySort.values,
              NonEmptyArray.map((value: MasteriesQuerySort) =>
                labelValue(
                  value,
                  <TextLabel tooltip={t.masteries.filters.sort[value]}>
                    {t.masteries.filters.sortShort[value]}
                  </TextLabel>,
                ),
              ),
            )}
          </Radios>

          <Radios<MasteriesQueryOrder>
            name="order"
            value={masteriesQuery.order}
            setValue={setOrder}
          >
            {pipe(
              MasteriesQueryOrder.values,
              NonEmptyArray.map((value: MasteriesQueryOrder) => {
                const OrderIcon = orderIcon[value]

                return labelValue(
                  value,
                  <IconLabel tooltip={t.masteries.filters.order[value]} className="w-6">
                    <OrderIcon className="w-5" />
                  </IconLabel>,
                )
              }),
            )}
          </Radios>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div onMouseLeave={hideLevelsMenu} className="relative">
          <Checkboxes<ChampionLevel>
            eq={ChampionLevel.Eq}
            values={pipe(
              ChampionLevel.values,
              List.reverse,
              List.map(level => ({
                key: level,
                value: level,
                icon: isChecked => (
                  <MasteryImg
                    level={level}
                    className={cx('h-full', ['drop-shadow-[0_0_3px_black]', isChecked])}
                  />
                ),
                label: t.masteries.filters.level(level),
              })),
            )}
            checked={masteriesQuery.level}
            toggleChecked={toggleMasteryChecked}
            isMenuVisible={levelsMenuIsVisible}
            onMouseEnter={handleMasteriesMouseEnter}
            tooltipPlacement="top"
            iconClassName="px-0.5 pt-1.5 pb-1"
            className="relative z-30"
          />
          <ul
            className={cx(
              'absolute z-20 flex w-full flex-col overflow-hidden rounded-b-md border-t border-black bg-zinc-700 shadow-even shadow-black',
              ['hidden', !levelsMenuIsVisible],
            )}
          >
            <SelectLevelsButton levels={ChampionLevel.values}>
              {t.masteries.filters.all}
            </SelectLevelsButton>
            <SelectLevelsButton levels={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]}>
              {t.masteries.filters.nineAndLess}
            </SelectLevelsButton>
            {pipe(
              ChampionLevel.values,
              List.reverse,
              List.map(level => (
                <SelectLevelsButton key={level} levels={[level]}>
                  {level === 10 ? t.masteries.filters.tenAndMore : t.common.number(level)}
                </SelectLevelsButton>
              )),
            )}
          </ul>
        </div>

        <Checkboxes<ChampionFactionOrNone>
          eq={ChampionFactionOrNone.Eq}
          values={pipe(
            ChampionFactionOrNone.values,
            List.map(faction => ({
              key: faction,
              value: faction,
              icon: isChecked =>
                faction === 'none' ? (
                  <span
                    className={cx(
                      'flex w-6 justify-center',
                      isChecked ? 'text-black' : 'text-wheat-bis',
                    )}
                  >
                    <CircleOffOutline className="w-4 -rotate-90" />
                  </span>
                ) : (
                  <ChampionFactionImg
                    faction={faction}
                    className={cx('size-6', isChecked ? 'text-black' : 'text-wheat-bis')}
                  />
                ),
              label: t.common.labels.factionOrNone[faction],
            })),
          )}
          checked={masteriesQuery.faction}
          toggleChecked={toggleFactionChecked}
          tooltipPlacement="top"
          iconClassName="px-1"
        />

        <Checkboxes<ChampionPosition>
          eq={ChampionPosition.Eq}
          values={pipe(
            ChampionPosition.values,
            List.map(position => ({
              key: position,
              value: position,
              icon: isChecked => (
                <ChampionPositionImg
                  position={position}
                  className={cx('w-6', isChecked ? 'text-black' : 'text-wheat-bis')}
                />
              ),
              label: t.common.labels.position[position],
            })),
          )}
          checked={masteriesQuery.position}
          toggleChecked={togglePositionChecked}
          tooltipPlacement="top"
          iconClassName="px-1.5"
        />

        <SearchChampion
          searchCount={searchCount}
          randomChampion={randomChampion}
          initialSearch={masteriesQuery.search}
          onChange={setQuerySearch}
        />
      </div>
    </div>
  )
}

type SelectLevelsButtonProps = {
  levels: NonEmptyArray<ChampionLevel>
  children?: React.ReactNode
}

const getSelectLevelsButton =
  (
    selectedLevels: ReadonlySet<ChampionLevel>,
    setLevels: (levels: ReadonlySet<ChampionLevel>) => void,
  ): React.FC<SelectLevelsButtonProps> =>
  ({ levels, children }) => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const levelsSet = useMemo(() => new Set(levels), levels)
    const handleClick = useCallback(() => setLevels(levelsSet), [levelsSet])
    const isSelected = readonlySet.getEq(ChampionLevel.Eq).equals(selectedLevels, levelsSet)

    return (
      <li className="group contents">
        <button
          type="button"
          onClick={handleClick}
          disabled={isSelected}
          className={cx(
            'flex items-center justify-between gap-1 py-1.5 pl-4 pr-2 text-left text-sm font-medium',
            isSelected ? 'bg-goldenrod-bis text-black' : 'hover:bg-black',
          )}
        >
          <span>{children}</span>
          <span className="flex gap-0.5">
            {pipe(
              levelsSet,
              readonlySet.toReadonlyArray<ChampionLevel>(ord.reverse(ChampionLevel.Ord)),
              List.map(level => (
                <MasteryImg
                  key={level}
                  level={level}
                  className={cx('h-5', ['drop-shadow-[0_0_3px_black]', isSelected])}
                />
              )),
            )}
          </span>
        </button>
      </li>
    )
  }

type SpanProps = {
  tooltip: React.ReactNode
  className?: string
  children?: React.ReactNode
}

const TextLabel: React.FC<SpanProps> = ({ tooltip, className, children }) => {
  const hoverRef = useRef<HTMLSpanElement>(null)
  return (
    <>
      <span
        ref={hoverRef}
        className={cx('flex h-6 w-10 items-center justify-center text-sm font-semibold', className)}
      >
        {children}
      </span>
      <Tooltip hoverRef={hoverRef} placement="top">
        {tooltip}
      </Tooltip>
    </>
  )
}

const IconLabel: React.FC<SpanProps> = ({ tooltip, className, children }) => {
  const hoverRef = useRef<HTMLSpanElement>(null)

  return (
    <>
      <span
        ref={hoverRef}
        className={cx(
          'flex h-6 items-center justify-center gap-1.5 text-sm font-medium',
          className,
        )}
      >
        {children}
      </span>
      <Tooltip hoverRef={hoverRef} placement="top">
        {tooltip}
      </Tooltip>
    </>
  )
}

const orderIcon: Dict<MasteriesQueryOrder, SVGIcon> = {
  asc: CaretUpOutline,
  desc: CaretDownOutline,
}
