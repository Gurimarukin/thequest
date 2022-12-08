import React from 'react'

import type { ChampionLevelOrZero } from '../../shared/models/api/ChampionLevel'

import { Assets } from '../imgs/Assets'

type Props = {
  readonly level: ChampionLevelOrZero
  readonly className?: string
}

export const MasteryImg = ({ level, className }: Props): JSX.Element => (
  <img src={Assets.masteries[level]} alt={`Level ${level} icon`} className={className} />
)
