/* eslint-disable functional/no-expression-statements,
                  functional/no-return-void */
import { io, number, ord, readonlySet } from 'fp-ts'
import type { Endomorphism } from 'fp-ts/Endomorphism'
import { flow, pipe } from 'fp-ts/function'
import { lens } from 'monocle-ts'
import type React from 'react'
import { useCallback, useMemo, useRef, useState } from 'react'

import { ChampionFactionOrNone } from '../../../../shared/models/api/champion/ChampionFaction'
import { ChampionLevelOrZero } from '../../../../shared/models/api/champion/ChampionLevel'
import { ChampionPosition } from '../../../../shared/models/api/champion/ChampionPosition'
import type { NonEmptyArray } from '../../../../shared/utils/fp'
import { List, Maybe } from '../../../../shared/utils/fp'

import { ChampionFactionImg } from '../../../components/ChampionFactionImg'
import { ChampionPositionImg } from '../../../components/ChampionPositionImg'
import { MaskedImage } from '../../../components/MaskedImage'
import { MasteryImg } from '../../../components/MasteryImg'
import { Radios, labelValue } from '../../../components/Radios'
import type { SearchChampionRef } from '../../../components/SearchChampion'
import { SearchChampion } from '../../../components/SearchChampion'
import { Tooltip } from '../../../components/tooltip/Tooltip'
import { useHistory } from '../../../contexts/HistoryContext'
import { useUser } from '../../../contexts/UserContext'
import { Assets } from '../../../imgs/Assets'
import {
  AppsSharp,
  CaretDownOutline,
  CaretUpOutline,
  CircleOffOutline,
  DiceFilled,
  StatsChartSharp,
} from '../../../imgs/svgIcons'
import { HowlingAbyssSimple } from '../../../imgs/svgs/HowlingAbyss'
import { MasteriesQuery } from '../../../models/masteriesQuery/MasteriesQuery'
import type { MasteriesQueryOrder } from '../../../models/masteriesQuery/MasteriesQueryOrder'
import type { MasteriesQuerySort } from '../../../models/masteriesQuery/MasteriesQuerySort'
import type { MasteriesQueryView } from '../../../models/masteriesQuery/MasteriesQueryView'
import { cx } from '../../../utils/cx'
import { Checkboxes } from './Checkboxes'

type Props = {
  searchCount: number
  randomChampion: Maybe<() => string>
}

export const MasteriesFilters: React.FC<Props> = ({ searchCount, randomChampion }) => {
  const { masteriesQuery, updateMasteriesQuery } = useHistory()
  const { maybeUser } = useUser()

  const [levelsMenuIsVisible, setLevelsMenuIsVisible] = useState(false)
  const handleMasteriesMouseEnter = useCallback(() => {
    if (!levelsMenuIsVisible) setLevelsMenuIsVisible(true)
  }, [levelsMenuIsVisible])
  const hideLevelsMenu = useCallback(() => setLevelsMenuIsVisible(false), [])

  const toggleMasteryChecked = useCallback(
    (f: Endomorphism<ReadonlySet<ChampionLevelOrZero>>): void => {
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

  const searchRef = useRef<SearchChampionRef>(null)

  const handleRandomClick = useMemo(
    (): (() => void) | undefined =>
      pipe(
        randomChampion,
        Maybe.map(io.map(name => searchRef.current?.setSearch(name))),
        Maybe.toUndefined,
      ),
    [randomChampion],
  )

  const randomButtonRef = useRef<HTMLButtonElement>(null)

  return (
    <div className="flex w-full max-w-7xl flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Radios<MasteriesQueryView> name="view" value={masteriesQuery.view} setValue={setView}>
          {labelValue(
            'compact',
            <IconLabel tooltip="Vue compacte" className="px-1.5">
              <AppsSharp className="w-4" />
              <span>Compact</span>
            </IconLabel>,
          )}
          {labelValue(
            'histogram',
            <IconLabel tooltip="Vue histogramme" className="px-1.5">
              <StatsChartSharp className="w-5 rotate-90 -scale-x-100" />
              <span>Histogramme</span>
            </IconLabel>,
          )}
          {labelValue(
            'aram',
            <IconLabel tooltip="Vue ARAM" className="px-1.5">
              <HowlingAbyssSimple className="w-[18px]" />
              <span>ARAM</span>
            </IconLabel>,
          )}
          {labelValue(
            'factions',
            <IconLabel tooltip="Vue factions" className="px-1.5">
              <MaskedImage src={Assets.runeterra} className="h-[18px] w-[18px]" />
              <span>Factions</span>
            </IconLabel>,
          )}
        </Radios>

        <div className="flex flex-wrap items-center gap-3">
          <Radios<MasteriesQuerySort> name="sort" value={masteriesQuery.sort} setValue={setSort}>
            {labelValue(
              'percents',
              <TextLabel
                tooltip={`Trier par pourcents / ${
                  Maybe.isSome(maybeUser) ? 'fragments / ' : ''
                }points`}
              >
                %
              </TextLabel>,
            )}
            {labelValue('points', <TextLabel tooltip="Trier par points">pts</TextLabel>)}
            {labelValue('name', <TextLabel tooltip="Trier par nom">nom</TextLabel>)}
          </Radios>

          <Radios<MasteriesQueryOrder>
            name="order"
            value={masteriesQuery.order}
            setValue={setOrder}
          >
            {labelValue(
              'desc',
              <IconLabel tooltip="Tri décroissant" className="w-6">
                <CaretDownOutline className="w-5" />
              </IconLabel>,
            )}
            {labelValue(
              'asc',
              <IconLabel tooltip="Tri croissant" className="w-6">
                <CaretUpOutline className="w-5" />
              </IconLabel>,
            )}
          </Radios>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div onMouseLeave={hideLevelsMenu} className="relative">
          <Checkboxes<ChampionLevelOrZero>
            eq={ChampionLevelOrZero.Eq}
            values={pipe(
              ChampionLevelOrZero.values,
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
                label: `Niveau ${level}`,
              })),
            )}
            checked={masteriesQuery.level}
            toggleChecked={toggleMasteryChecked}
            isMenuVisible={levelsMenuIsVisible}
            onMouseEnter={handleMasteriesMouseEnter}
            tooltipPlacement="top"
            iconClassName="px-[5px] pt-1 pb-0.5"
            className="relative z-20"
          />
          <ul
            className={cx(
              'absolute z-10 flex w-full flex-col overflow-hidden rounded-b-md border-t border-black bg-zinc-700 shadow-even shadow-black',
              ['hidden', !levelsMenuIsVisible],
            )}
          >
            <SelectLevelsButton levels={[0, 1, 2, 3, 4, 5, 6]}>6 et moins</SelectLevelsButton>
            <SelectLevelsButton levels={[5, 6]}>5 et 6</SelectLevelsButton>
            <SelectLevelsButton levels={[0, 1, 2, 3, 4]}>4 et moins</SelectLevelsButton>
            {pipe(
              ChampionLevelOrZero.values,
              List.reverse,
              List.map(level => (
                <SelectLevelsButton key={level} levels={[level]}>
                  {level}
                </SelectLevelsButton>
              )),
            )}
            <SelectLevelsButton levels={ChampionLevelOrZero.values}>tous</SelectLevelsButton>
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
                    className={cx('h-6 w-6', isChecked ? 'text-black' : 'text-wheat-bis')}
                  />
                ),
              label: ChampionFactionOrNone.label[faction],
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
                  className={cx('w-6', ['brightness-150 contrast-200 grayscale invert', isChecked])}
                />
              ),
              label: ChampionPosition.label[position],
            })),
          )}
          checked={masteriesQuery.position}
          toggleChecked={togglePositionChecked}
          tooltipPlacement="top"
          iconClassName="px-1.5"
        />

        <div className="flex flex-wrap items-center gap-3">
          <SearchChampion
            ref={searchRef}
            searchCount={searchCount}
            initialSearch={masteriesQuery.search}
            onChange={setQuerySearch}
          />

          <button
            ref={randomButtonRef}
            type="button"
            onClick={handleRandomClick}
            disabled={Maybe.isNone(randomChampion)}
            className="group -mx-0.5 overflow-hidden p-0.5 disabled:opacity-30"
          >
            <DiceFilled className="h-7 transition-transform duration-300 group-enabled:group-hover:animate-dice" />
          </button>
          <Tooltip hoverRef={randomButtonRef} placement="top">
            Champion aléatoire
          </Tooltip>
        </div>
      </div>
    </div>
  )
}

type SelectLevelsButtonProps = {
  levels: NonEmptyArray<ChampionLevelOrZero>
  children?: React.ReactNode
}

const getSelectLevelsButton =
  (
    selectedLevels: ReadonlySet<ChampionLevelOrZero>,
    setLevels: (levels: ReadonlySet<ChampionLevelOrZero>) => void,
  ): React.FC<SelectLevelsButtonProps> =>
  ({ levels, children }) => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const levelsSet = useMemo(() => new Set(levels), levels)
    const handleClick = useCallback(() => setLevels(levelsSet), [levelsSet])
    const isSelected = readonlySet.getEq(ChampionLevelOrZero.Eq).equals(selectedLevels, levelsSet)

    return (
      <li className="group contents">
        <button
          type="button"
          onClick={handleClick}
          disabled={isSelected}
          className={cx(
            'flex items-center justify-between gap-1 py-1.5 pl-4 pr-2 text-left text-sm',
            isSelected ? 'bg-goldenrod-bis text-black' : 'hover:bg-black',
          )}
        >
          <span>{children}</span>
          <span className="flex gap-1">
            {pipe(
              levelsSet,
              readonlySet.toReadonlyArray<ChampionLevelOrZero>(ord.reverse(number.Ord)),
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
        className={cx('flex h-6 w-10 items-center justify-center text-sm', className)}
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
        className={cx('flex h-6 items-center justify-center gap-1.5 text-xs', className)}
      >
        {children}
      </span>
      <Tooltip hoverRef={hoverRef} placement="top">
        {tooltip}
      </Tooltip>
    </>
  )
}
