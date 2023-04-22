import React from 'react'

import { Spell } from '../../../shared/models/api/Spell'

import type { AramStatsProps } from './AramStats'
import { getAramStats, renderStatIcon, renderStatValue } from './AramStats'

export const AramStatsShort: (props: AramStatsProps) => JSX.Element | null = getAramStats(
  name => {
    const icon = renderStatIcon(name)
    const renderStatValue_ = renderStatValue(name)
    return value => (
      <div key={name} className="flex items-center gap-1">
        <span>{icon}</span>
        {renderStatValue_(value)}
      </div>
    )
  },
  spell => html =>
    (
      <div key={spell} className="flex items-center gap-1">
        <span dangerouslySetInnerHTML={{ __html: html.spell }} className="wikia compact" />
        <span>{Spell.label[spell]}</span>
      </div>
    ),
  4,
)
