/* eslint-disable functional/no-expression-statements */
import { useCallback } from 'react'

import { useHistory } from '../contexts/HistoryContext'

type Props = {
  to: string
  target?: string
  onClick?: React.MouseEventHandler<HTMLAnchorElement>
  className?: string
  children?: React.ReactNode
}

export const Link: React.FC<Props> = ({ to, target, onClick: onClick_, className, children }) => {
  const { navigate } = useHistory()

  const onClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        onClick_?.(e)
        navigate(to)
      }
    },
    [navigate, onClick_, to],
  )

  return (
    <a href={to} onClick={onClick} target={target} className={className}>
      {children}
    </a>
  )
}
