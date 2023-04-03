/* eslint-disable functional/no-expression-statements */
import React, { useCallback } from 'react'

import { useHistory } from '../contexts/HistoryContext'

type Props = {
  to: string
  target?: string
  onClick?: React.MouseEventHandler<HTMLAnchorElement>
  className?: string
  children?: React.ReactNode
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
