/* eslint-disable functional/no-expression-statements,
                  functional/no-return-void */
import { number, ord, readonlySet } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import { lens } from 'monocle-ts'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ChampionLevelOrZero } from '../../../shared/models/api/ChampionLevel'
import { StringUtils } from '../../../shared/utils/StringUtils'
import type { NonEmptyArray } from '../../../shared/utils/fp'
import { List, Maybe } from '../../../shared/utils/fp'

import { MasteryImg } from '../../components/MasteryImg'
import { Radios, labelValue } from '../../components/Radios'
import { Tooltip } from '../../components/Tooltip'
import { useHistory } from '../../contexts/HistoryContext'
import { useUser } from '../../contexts/UserContext'
import {
  AppsSharp,
  CaretDownOutline,
  CaretUpOutline,
  CloseFilled,
  StatsChartSharp,
} from '../../imgs/svgIcons'
import { MasteriesQuery } from '../../models/masteriesQuery/MasteriesQuery'
import type { MasteriesQueryOrder } from '../../models/masteriesQuery/MasteriesQueryOrder'
import type { MasteriesQuerySort } from '../../models/masteriesQuery/MasteriesQuerySort'
import type { MasteriesQueryView } from '../../models/masteriesQuery/MasteriesQueryView'
import { cssClasses } from '../../utils/cssClasses'

const { plural } = StringUtils

type Props = {
  championsCount: number
  totalChampionsCount: number
  searchCount: number
}

export const MasteriesFilters = ({
  championsCount,
  totalChampionsCount,
  searchCount,
}: Props): JSX.Element => {
  const { masteriesQuery, updateMasteriesQuery } = useHistory()
  const { user } = useUser()

  const [levelsMenuIsVisible, setLevelsMenuIsVisible] = useState(false)
  const handleMouseEnter = useCallback(() => {
    if (!levelsMenuIsVisible) setLevelsMenuIsVisible(true)
  }, [levelsMenuIsVisible])
  const hideLevelsMenu = useCallback(() => setLevelsMenuIsVisible(false), [])

  const toggleChecked = useCallback(
    (level: ChampionLevelOrZero) =>
      (e: React.ChangeEvent<HTMLInputElement>): void => {
        updateMasteriesQuery(
          pipe(
            MasteriesQuery.Lens.level,
            lens.modify(
              e.target.checked
                ? readonlySet.insert(ChampionLevelOrZero.Eq)(level)
                : readonlySet.remove(ChampionLevelOrZero.Eq)(level),
            ),
          ),
        )
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

  const setSort = flow(MasteriesQuery.Lens.sort.set, updateMasteriesQuery)
  const setOrder = flow(MasteriesQuery.Lens.order.set, updateMasteriesQuery)
  const setView = flow(MasteriesQuery.Lens.view.set, updateMasteriesQuery)

  const searchRef = useRef<HTMLInputElement>(null)
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
    <div className="flex w-full max-w-7xl flex-col flex-wrap self-center px-3 pt-1">
      <div className="flex flex-wrap items-center justify-between gap-5 py-3">
        <div onMouseLeave={hideLevelsMenu} className="relative">
          <MasteriesCheckboxes
            checkedLevels={masteriesQuery.level}
            toggleChecked={toggleChecked}
            onMouseEnter={handleMouseEnter}
          />
          <ul
            className={cssClasses(
              'absolute z-10 flex w-full flex-col border-2 border-mastery4-brown-secondary bg-black',
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
        <div className="flex gap-3">
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
          <Radios<MasteriesQueryOrder>
            name="order"
            value={masteriesQuery.order}
            setValue={setOrder}
          >
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
          </Radios>
        </div>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] flex-wrap items-center justify-between gap-5">
        <div className="flex items-center text-xs">
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Rechercher un champion"
            className={cssClasses(
              'w-[171px] justify-self-start rounded-sm border border-zinc-700 bg-transparent py-1 pl-2',
              ['pr-2', search === ''],
              ['pr-7', search !== ''],
            )}
          />
          {search !== '' ? (
            <button type="button" onClick={emptySearch} className="-ml-6 mr-4">
              <CloseFilled className="h-5 fill-wheat" />
            </button>
          ) : null}
          {Maybe.isSome(masteriesQuery.search) ? (
            <span className="text-zinc-400">{plural(searchCount, 'résultat')}</span>
          ) : null}
        </div>
        <span className="text-sm">{`${plural(
          championsCount,
          'champion',
        )} / ${totalChampionsCount}`}</span>
        <span />
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
            'flex items-center justify-between gap-1 py-[6px] pr-2 pl-4 text-left text-sm',
            ['hover:bg-zinc-700', !isSelected],
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

type MasteriesCheckboxesProps = {
  checkedLevels: ReadonlySet<ChampionLevelOrZero>
  toggleChecked: (level: ChampionLevelOrZero) => (e: React.ChangeEvent<HTMLInputElement>) => void
  onMouseEnter?: React.MouseEventHandler<HTMLDivElement>
}

const MasteriesCheckboxes = ({
  checkedLevels,
  toggleChecked,
  onMouseEnter,
}: MasteriesCheckboxesProps): JSX.Element => (
  <div onMouseEnter={onMouseEnter} className="flex">
    {pipe(
      ChampionLevelOrZero.values,
      List.reverse,
      List.map(level => {
        const isChecked = readonlySet.elem(ChampionLevelOrZero.Eq)(level, checkedLevels)
        return (
          <label key={level} className="group/mastery">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={toggleChecked(level)}
              className="hidden"
            />
            <span
              title={`Niveau ${level}`}
              className={cssClasses(
                'flex h-10 cursor-pointer py-1 px-[6px] group-first/mastery:rounded-l-md group-last/mastery:rounded-r-md',
                ['bg-zinc-700', !isChecked],
                ['bg-goldenrod-secondary', isChecked],
              )}
            >
              <MasteryImg
                level={level}
                className={cssClasses('h-full', ['drop-shadow-[0_0_3px_black]', isChecked])}
              />
            </span>
          </label>
        )
      }),
    )}
  </div>
)

type SpanProps = {
  tooltip: React.ReactNode
}

const TextLabel: React.FC<SpanProps> = ({ tooltip, children }) => (
  <Tooltip tooltip={tooltip}>
    <span className="flex h-6 w-10 items-center justify-center text-sm">{children}</span>
  </Tooltip>
)

const IconLabel: React.FC<SpanProps> = ({ tooltip, children }) => (
  <Tooltip tooltip={tooltip}>
    <span className="flex h-6 w-6 items-center justify-center">{children}</span>
  </Tooltip>
)
