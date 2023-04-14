import React from 'react'

import { Lane } from '../../shared/models/api/Lane'

import { Assets } from '../imgs/Assets'

type Props = {
  lane: Lane
  className?: string
}

export const LaneImg = ({ lane, className }: Props): JSX.Element => (
  <img src={Assets.lanes[lane]} alt={`Icône voie ${Lane.label[lane]}`} className={className} />
)
