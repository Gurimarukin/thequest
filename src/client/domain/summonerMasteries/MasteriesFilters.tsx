/* eslint-disable functional/no-expression-statement,
                  functional/no-return-void */
import { number, ord, readonlySet } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import { lens } from 'monocle-ts'
import React, { useCallback, useMemo, useState } from 'react'

import { ChampionLevelOrZero } from '../../../shared/models/api/ChampionLevel'
import type { NonEmptyArray } from '../../../shared/utils/fp'
import { List } from '../../../shared/utils/fp'

import { MasteryImg } from '../../components/MasteryImg'
import { Radios, labelValue } from '../../components/Radios'
import { useHistory } from '../../contexts/HistoryContext'
import { AppsSharp, CaretDownOutline, CaretUpOutline, StatsChartSharp } from '../../imgs/svgIcons'
import { MasteriesQuery } from '../../models/masteriesQuery/MasteriesQuery'
import type { MasteriesQueryOrder } from '../../models/masteriesQuery/MasteriesQueryOrder'
import type { MasteriesQuerySort } from '../../models/masteriesQuery/MasteriesQuerySort'
import type { MasteriesQueryView } from '../../models/masteriesQuery/MasteriesQueryView'
import { cssClasses } from '../../utils/cssClasses'

export const MasteriesFilters = (): JSX.Element => {
  const { masteriesQuery, updateMasteriesQuery } = useHistory()

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

  return (
    <div className="flex flex-wrap items-center justify-evenly gap-5 py-3">
      <div onMouseLeave={hideLevelsMenu} className="relative">
        <MasteriesCheckboxes
          checkedLevels={masteriesQuery.level}
          toggleChecked={toggleChecked}
          onMouseEnter={handleMouseEnter}
        />
        <ul
          className={cssClasses(
            'absolute z-10 flex w-full flex-col border-2 border-mastery4-brown-secondary bg-black',
            ['invisible', !levelsMenuIsVisible],
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
          {labelValue('percents', <TextLabel title="Trier par pourcents">%</TextLabel>)}
          {labelValue('points', <TextLabel title="Trier par points">pts</TextLabel>)}
        </Radios>
        <Radios<MasteriesQueryOrder> name="order" value={masteriesQuery.order} setValue={setOrder}>
          {labelValue(
            'desc',
            <IconLabel title="Tri décroissant">
              <CaretDownOutline className="h-6 fill-current" />
            </IconLabel>,
          )}
          {labelValue(
            'asc',
            <IconLabel title="Tri croissant">
              <CaretUpOutline className="h-6 fill-current" />
            </IconLabel>,
          )}
        </Radios>
        <Radios<MasteriesQueryView> name="view" value={masteriesQuery.view} setValue={setView}>
          {labelValue(
            'compact',
            <IconLabel title="Vue compacte">
              <AppsSharp className="h-4 fill-current" />
            </IconLabel>,
          )}
          {labelValue(
            'histogram',
            <IconLabel title="Vue histogramme">
              <StatsChartSharp className="h-5 rotate-90 scale-x-[-1] fill-current" />
            </IconLabel>,
          )}
        </Radios>
      </div>
    </div>
  )
}

type SelectLevelsButtonProps = {
  readonly levels: NonEmptyArray<ChampionLevelOrZero>
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
            'flex items-center justify-between gap-1 py-1 pr-2 pl-4 text-left text-sm',
            ['hover:bg-zinc-700', !isSelected],
            ['bg-goldenrod text-black', isSelected],
          )}
        >
          <span>{children}</span>
          <span className="flex">
            {pipe(
              levelsSet,
              readonlySet.toReadonlyArray<ChampionLevelOrZero>(ord.reverse(number.Ord)),
              List.map(level => (
                <MasteryImg
                  key={level}
                  level={level}
                  className={cssClasses('h-6', ['drop-shadow-[0_0_3px_black]', isSelected])}
                />
              )),
            )}
          </span>
        </button>
      </li>
    )
  }

type MasteriesCheckboxesProps = {
  readonly checkedLevels: ReadonlySet<ChampionLevelOrZero>
  readonly toggleChecked: (
    level: ChampionLevelOrZero,
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void
  readonly onMouseEnter?: React.MouseEventHandler<HTMLDivElement>
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
          // eslint-disable-next-line tailwindcss/no-custom-classname
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
                'flex h-10 p-[2px] cursor-pointer group-first/mastery:rounded-l-md group-last/mastery:rounded-r-md',
                ['bg-zinc-700', !isChecked],
                ['bg-goldenrod', isChecked],
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
  readonly title?: string
}

const TextLabel: React.FC<SpanProps> = ({ title, children }) => (
  <span title={title} className="flex h-6 w-8 items-center justify-center text-sm">
    {children}
  </span>
)

const IconLabel: React.FC<SpanProps> = ({ title, children }) => (
  <span title={title} className="flex h-6 w-6 items-center justify-center">
    {children}
  </span>
)
