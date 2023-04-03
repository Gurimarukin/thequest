import React from 'react'

import type { ChampionLevelOrZero } from '../../shared/models/api/ChampionLevel'

import { Assets } from '../imgs/Assets'
import { cssClasses } from '../utils/cssClasses'

type Props = {
  level: ChampionLevelOrZero
  title?: string
  className?: string
}

export const MasteryImg = ({ level, title, className }: Readonly<Props>): JSX.Element => (
  <img
    src={Assets.masteries[level]}
    alt={`Icône niveau ${level}`}
    title={title}
    className={cssClasses(['grayscale', level === 0], className)}
  />
)
