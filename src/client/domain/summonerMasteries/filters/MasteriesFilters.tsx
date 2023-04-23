/* eslint-disable functional/no-expression-statements,
                  functional/no-return-void */
import { number, ord, readonlySet } from 'fp-ts'
import type { Endomorphism } from 'fp-ts/Endomorphism'
import { flow, pipe } from 'fp-ts/function'
import { lens } from 'monocle-ts'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ChampionLevelOrZero } from '../../../../shared/models/api/champion/ChampionLevel'
import { ChampionPosition } from '../../../../shared/models/api/champion/ChampionPosition'
import { StringUtils } from '../../../../shared/utils/StringUtils'
import type { NonEmptyArray } from '../../../../shared/utils/fp'
import { List, Maybe } from '../../../../shared/utils/fp'

import { ChampionPositionImg } from '../../../components/ChampionPositionImg'
import { MasteryImg } from '../../../components/MasteryImg'
import { Radios, labelValue } from '../../../components/Radios'
import { Tooltip } from '../../../components/tooltip/Tooltip'
import { useHistory } from '../../../contexts/HistoryContext'
import { useUser } from '../../../contexts/UserContext'
import { HowlingAbyssSimple } from '../../../imgs/HowlingAbyss'
import {
  AppsSharp,
  CaretDownOutline,
  CaretUpOutline,
  CloseFilled,
  StatsChartSharp,
} from '../../../imgs/svgIcons'
import { MasteriesQuery } from '../../../models/masteriesQuery/MasteriesQuery'
import type { MasteriesQueryOrder } from '../../../models/masteriesQuery/MasteriesQueryOrder'
import type { MasteriesQuerySort } from '../../../models/masteriesQuery/MasteriesQuerySort'
import type { MasteriesQueryView } from '../../../models/masteriesQuery/MasteriesQueryView'
import { cssClasses } from '../../../utils/cssClasses'
import { Checkboxes } from './Checkboxes'

const { plural } = StringUtils

type Props = {
  searchCount: number
}

export const MasteriesFilters = ({ searchCount }: Props): JSX.Element => {
  const { masteriesQuery, updateMasteriesQuery } = useHistory()
  const { user } = useUser()

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

  const toggleLaneChecked = useCallback(
    (f: Endomorphism<ReadonlySet<ChampionPosition>>): void =>
      updateMasteriesQuery(pipe(MasteriesQuery.Lens.position, lens.modify(f))),
    [updateMasteriesQuery],
  )

  const setSort = flow(MasteriesQuery.Lens.sort.set, updateMasteriesQuery)
  const setOrder = flow(MasteriesQuery.Lens.order.set, updateMasteriesQuery)
  const setView = flow(MasteriesQuery.Lens.view.set, updateMasteriesQuery)

  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKeyup = (e: KeyboardEvent): void => {
      if (
        (e.key.toLowerCase() === 'f' && (e.ctrlKey || e.metaKey)) ||
        e.key === '/' ||
        e.key === 'F3'
      ) {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }

    document.addEventListener('keydown', onKeyup, true)
    return () => document.removeEventListener('keydown', onKeyup, true)
  }, [])

  const [search, setSearch] = useState(
    pipe(
      masteriesQuery.search,
      Maybe.getOrElse(() => ''),
    ),
  )

  const emptySearch = useCallback(() => {
    setSearch('')
    searchRef.current?.focus()
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSearch('')
      searchRef.current?.blur()
    }
  }, [])

  const updateSearch = useCallback(
    (search_: string) => {
      const trimed = search_.trim()
      updateMasteriesQuery(
        MasteriesQuery.Lens.search.set(trimed === '' ? Maybe.none : Maybe.some(trimed)),
      )
    },
    [updateMasteriesQuery],
  )

  useEffect(() => {
    updateSearch(search)
  }, [updateSearch, search])

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value),
    [],
  )

  return (
    <div className="flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 self-center">
      <div className="flex flex-wrap items-center gap-3">
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
                    className={cssClasses('h-full', ['drop-shadow-[0_0_3px_black]', isChecked])}
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
            className={cssClasses(
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
                  className={cssClasses('w-[24px]', [
                    'brightness-150 contrast-200 grayscale invert',
                    isChecked,
                  ])}
                />
              ),
              label: ChampionPosition.label[position],
            })),
          )}
          checked={masteriesQuery.position}
          toggleChecked={toggleLaneChecked}
          iconClassName="p-1.5"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex flex-col items-center text-xs">
          <div className="flex items-center">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              placeholder="Rechercher un champion"
              className={cssClasses(
                'w-[171px] justify-self-start rounded-sm border border-zinc-700 bg-transparent py-1 pl-2',
                ['pr-2', search === ''],
                ['pr-7', search !== ''],
              )}
            />
            {search !== '' ? (
              <button type="button" onClick={emptySearch} className="-ml-6">
                <CloseFilled className="h-5 fill-wheat" />
              </button>
            ) : null}
          </div>
          <span
            className={cssClasses('absolute top-full pt-0.5 text-zinc-400', [
              'hidden',
              Maybe.isNone(masteriesQuery.search),
            ])}
          >
            {plural('résultat')(searchCount)}
          </span>
        </div>

        <Radios<MasteriesQuerySort> name="sort" value={masteriesQuery.sort} setValue={setSort}>
          {labelValue(
            'percents',
            <TextLabel
              tooltip={`Trier par pourcents / ${Maybe.isSome(user) ? 'fragments / ' : ''}points`}
            >
              %
            </TextLabel>,
          )}
          {labelValue('points', <TextLabel tooltip="Trier par points">pts</TextLabel>)}
          {labelValue('name', <TextLabel tooltip="Trier par nom">nom</TextLabel>)}
        </Radios>

        <Radios<MasteriesQueryOrder> name="order" value={masteriesQuery.order} setValue={setOrder}>
          {labelValue(
            'desc',
            <IconLabel tooltip="Tri décroissant">
              <CaretDownOutline className="h-5 fill-current" />
            </IconLabel>,
          )}
          {labelValue(
            'asc',
            <IconLabel tooltip="Tri croissant">
              <CaretUpOutline className="h-5 fill-current" />
            </IconLabel>,
          )}
        </Radios>

        <Radios<MasteriesQueryView> name="view" value={masteriesQuery.view} setValue={setView}>
          {labelValue(
            'compact',
            <IconLabel tooltip="Vue compacte">
              <AppsSharp className="h-4 fill-current" />
            </IconLabel>,
          )}
          {labelValue(
            'histogram',
            <IconLabel tooltip="Vue histogramme">
              <StatsChartSharp className="h-5 rotate-90 scale-x-[-1] fill-current" />
            </IconLabel>,
          )}
          {labelValue(
            'aram',
            <IconLabel tooltip="Vue ARAM">
              <HowlingAbyssSimple className="h-[18px]" />
            </IconLabel>,
          )}
        </Radios>
      </div>
    </div>
  )
}

type SelectLevelsButtonProps = {
  levels: NonEmptyArray<ChampionLevelOrZero>
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
          className={cssClasses(
            'flex items-center justify-between gap-1 py-1.5 pr-2 pl-4 text-left text-sm',
            ['hover:bg-black', !isSelected],
            ['bg-goldenrod-secondary text-black', isSelected],
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
                  className={cssClasses('h-5', ['drop-shadow-[0_0_3px_black]', isSelected])}
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
}

const TextLabel: React.FC<SpanProps> = ({ tooltip, children }) => {
  const hoverRef = useRef<HTMLSpanElement>(null)
  return (
    <>
      <span ref={hoverRef} className="flex h-6 w-10 items-center justify-center text-sm">
        {children}
      </span>
      <Tooltip hoverRef={hoverRef}>{tooltip}</Tooltip>
    </>
  )
}

const IconLabel: React.FC<SpanProps> = ({ tooltip, children }) => {
  const hoverRef = useRef<HTMLSpanElement>(null)
  return (
    <>
      <span ref={hoverRef} className="flex h-6 w-6 items-center justify-center">
        {children}
      </span>
      <Tooltip hoverRef={hoverRef}>{tooltip}</Tooltip>
    </>
  )
}
