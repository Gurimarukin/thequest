import React from 'react'

import type { ChampionLevelOrZero } from '../../shared/models/api/ChampionLevel'

import { Assets } from '../imgs/Assets'
import { cssClasses } from '../utils/cssClasses'

type Props = {
  readonly level: ChampionLevelOrZero
  readonly className?: string
}

export const MasteryImg = ({ level, className }: Props): JSX.Element => (
  <img
    src={Assets.masteries[level]}
    alt={`Level ${level} icon`}
    className={cssClasses(['grayscale', level === 0], className)}
  />
)
