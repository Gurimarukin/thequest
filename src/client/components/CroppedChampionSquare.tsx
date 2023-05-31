import type { HTMLAttributes } from 'react'
import { createElement, forwardRef } from 'react'

import type { ChampionKey } from '../../shared/models/api/champion/ChampionKey'

import { useStaticData } from '../contexts/StaticDataContext'
import { cx } from '../utils/cx'

type Props<A extends HTMLTag> = {
  championKey: ChampionKey
  championName: string
  as?: A
  children?: React.ReactNode
} & HTMLAttributes<ExtractElement<A>>

export const CroppedChampionSquare: <A extends HTMLTag = 'div'>(
  props: React.PropsWithoutRef<Props<A>> & React.RefAttributes<ExtractElement<A>>,
) => React.ReactElement | null = forwardRef(function <A extends HTMLTag>(
  { championKey, championName, as = 'div' as A, className, children, ...props }: Props<A>,
  ref: React.ForwardedRef<ExtractElement<A>>,
) {
  const { assets } = useStaticData()
  return createElement(
    as,
    { ...props, ref, className: cx('overflow-hidden', className) },
    <img
      src={assets.champion.square(championKey)}
      alt={`Icône de ${championName}`}
      className="m-[-6%] w-[112%] max-w-none"
    />,
    children,
  )
})

type HTMLTag = keyof React.ReactHTML

type ExtractElement<A extends HTMLTag> = React.ReactHTML[A] extends React.DetailedHTMLFactory<
  React.HTMLAttributes<unknown>,
  infer E
>
  ? E
  : never
