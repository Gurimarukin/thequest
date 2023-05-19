/* eslint-disable functional/no-expression-statements */
import { forwardRef, useCallback } from 'react'

import { useHistory } from '../contexts/HistoryContext'

export type LinkProps = {
  to: string
  onClick?: React.MouseEventHandler<HTMLAnchorElement>
  className?: string
  children?: React.ReactNode
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ to, onClick: onClick_, className, children }, ref) => {
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
      <a ref={ref} href={to} onClick={onClick} className={className}>
        {children}
      </a>
    )
  },
)
