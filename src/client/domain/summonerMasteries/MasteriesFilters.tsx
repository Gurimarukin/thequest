import { readonlySet } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import { lens } from 'monocle-ts'
import React from 'react'

import { ChampionLevelOrZero } from '../../../shared/models/api/ChampionLevel'
import { List } from '../../../shared/utils/fp'

import { Radios, labelValue } from '../../components/Radios'
import { useHistory } from '../../contexts/HistoryContext'
import { AppsSharp, CaretDownOutline, CaretUpOutline, StatsChartSharp } from '../../imgs/svgIcons'
import { MasteriesQuery } from '../../models/masteriesQuery/MasteriesQuery'
import type { MasteriesQueryOrder } from '../../models/masteriesQuery/MasteriesQueryOrder'
import type { MasteriesQuerySort } from '../../models/masteriesQuery/MasteriesQuerySort'
import type { MasteriesQueryView } from '../../models/masteriesQuery/MasteriesQueryView'

export const MasteriesFilters = (): JSX.Element => {
  const { masteriesQuery, updateMasteriesQuery } = useHistory()

  const setSort = flow(MasteriesQuery.Lens.sort.set, updateMasteriesQuery)
  const setOrder = flow(MasteriesQuery.Lens.order.set, updateMasteriesQuery)
  const setView = flow(MasteriesQuery.Lens.view.set, updateMasteriesQuery)

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

  return (
    <div className="flex justify-between gap-5 flex-wrap pt-3">
      <div className="flex gap-3">
        Maîtrises
        {pipe(
          ChampionLevelOrZero.values,
          List.reverse,
          List.map(level => (
            <label key={level} className="flex gap-1">
              <input
                type="checkbox"
                checked={readonlySet.elem(ChampionLevelOrZero.Eq)(level, masteriesQuery.level)}
                onChange={toggleChecked(level)}
              />
              <span>{level}</span>
            </label>
          )),
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
