import React from 'react'

import { ChampionPosition } from '../../shared/models/api/champion/ChampionPosition'

import { Assets } from '../imgs/Assets'

type Props = {
  position: ChampionPosition
  className?: string
}

export const ChampionPositionImg = ({ position, className }: Props): JSX.Element => (
  <img
    src={Assets.positions[position]}
    alt={`Icône position ${ChampionPosition.label[position]}`}
    className={className}
  />
)
