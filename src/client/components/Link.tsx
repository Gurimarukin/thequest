/* eslint-disable functional/no-expression-statements */
import { forwardRef, useCallback } from 'react'

import { useHistory } from '../contexts/HistoryContext'
import { cx } from '../utils/cx'

export type LinkProps = {
  to: string
  onClick?: React.MouseEventHandler<HTMLAnchorElement>
  disabled?: boolean
  className?: string
  children?: React.ReactNode
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ to, onClick: onClick_, disabled = false, className, children }, ref) => {
    const { navigate } = useHistory()

    const onClick = useCallback(
      (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (disabled) {
          e.preventDefault()
        } else {
          onClick_?.(e)
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault()
            navigate(to)
          }
        }
      },
      [disabled, navigate, onClick_, to],
    )

    return (
      <a
        ref={ref}
        href={to}
        onClick={onClick}
        className={cx(['cursor-default', disabled], className)}
      >
        {children}
      </a>
    )
  },
)
