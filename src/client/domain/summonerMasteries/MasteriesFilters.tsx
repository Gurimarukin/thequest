import { readonlySet } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import { lens } from 'monocle-ts'
import React from 'react'

import { ChampionLevelOrZero } from '../../../shared/models/api/ChampionLevel'
import { List } from '../../../shared/utils/fp'

import { Radios, labelValue } from '../../components/Radios'
import { useHistory } from '../../contexts/HistoryContext'
import { Assets } from '../../imgs/Assets'
import { AppsSharp, CaretDownOutline, CaretUpOutline, StatsChartSharp } from '../../imgs/svgIcons'
import { MasteriesQuery } from '../../models/masteriesQuery/MasteriesQuery'
import type { MasteriesQueryOrder } from '../../models/masteriesQuery/MasteriesQueryOrder'
import type { MasteriesQuerySort } from '../../models/masteriesQuery/MasteriesQuerySort'
import type { MasteriesQueryView } from '../../models/masteriesQuery/MasteriesQueryView'
import { cssClasses } from '../../utils/cssClasses'

export const MasteriesFilters = (): JSX.Element => {
  const { masteriesQuery, updateMasteriesQuery } = useHistory()

  const toggleChecked = (level: ChampionLevelOrZero) => (e: React.ChangeEvent<HTMLInputElement>) =>
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

  const setSort = flow(MasteriesQuery.Lens.sort.set, updateMasteriesQuery)
  const setOrder = flow(MasteriesQuery.Lens.order.set, updateMasteriesQuery)
  const setView = flow(MasteriesQuery.Lens.view.set, updateMasteriesQuery)

  return (
    <div className="flex items-center justify-between gap-5 flex-wrap pt-3">
      <div className="flex">
        {pipe(
          ChampionLevelOrZero.values,
          List.reverse,
          List.map(level => {
            const isChecked = readonlySet.elem(ChampionLevelOrZero.Eq)(level, masteriesQuery.level)
            return (
              <label key={level} className="group">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={toggleChecked(level)}
                  className="hidden"
                />
                <span
                  title={`Niveau ${level}`}
                  className={cssClasses(
                    'flex h-10 p-[2px] cursor-pointer group-first:rounded-l-md group-last:rounded-r-md',
                    ['bg-zinc-700', !isChecked],
                    ['bg-mastery4-brown', isChecked],
                  )}
                >
                  <img
                    src={Assets.masteries[level]}
                    alt={`Level ${level} icon`}
                    className={cssClasses('h-full', ['drop-shadow-[0_0_3px_black]', isChecked])}
                  />
                </span>
              </label>
            )
          }),
        )}
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

type SpanProps = {
  readonly title?: string
}

const TextLabel: React.FC<SpanProps> = ({ title, children }) => (
  <span title={title} className="flex justify-center items-center w-8 h-6 text-sm">
    {children}
  </span>
)

const IconLabel: React.FC<SpanProps> = ({ title, children }) => (
  <span title={title} className="flex justify-center items-center w-6 h-6">
    {children}
  </span>
)
