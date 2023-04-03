/* eslint-disable functional/no-expression-statements */
import React, { useCallback } from 'react'

import { useHistory } from '../contexts/HistoryContext'

type Props = {
  readonly to: string
  readonly target?: string
  readonly onClick?: React.MouseEventHandler<HTMLAnchorElement>
  readonly className?: string
  readonly children?: React.ReactNode
}

export const Link = ({
  to,
  target,
  onClick: onClick_,
  className,
  children,
}: Props): JSX.Element => {
  const { navigate } = useHistory()

  const onClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()
      onClick_?.(e)
      navigate(to)
    },
    [navigate, onClick_, to],
  )

  return (
    <a href={to} onClick={onClick} target={target} className={className}>
      {children}
    </a>
  )
}
