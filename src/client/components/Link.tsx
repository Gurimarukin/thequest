/* eslint-disable functional/no-expression-statements */
import { useCallback } from 'react'

import { useHistory } from '../contexts/HistoryContext'

type Props = {
  to: string
  onClick?: React.MouseEventHandler<HTMLAnchorElement>
  className?: string
  children?: React.ReactNode
}

export const Link: React.FC<Props> = ({ to, onClick: onClick_, className, children }) => {
  const { navigate } = useHistory()

  const onClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      onClick_?.(e)
      if (!e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        navigate(to)
      }
    },
    [navigate, onClick_, to],
  )

  return (
    <a href={to} onClick={onClick} className={className}>
      {children}
    </a>
  )
}
