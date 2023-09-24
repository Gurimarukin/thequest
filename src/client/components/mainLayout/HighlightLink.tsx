import type { Parser } from 'fp-ts-routing'
import { useRef } from 'react'

import { Maybe } from '../../../shared/utils/fp'

import { useHistory } from '../../contexts/HistoryContext'
import { cx } from '../../utils/cx'
import type { LinkProps } from '../Link'
import { Link } from '../Link'
import { Tooltip } from '../tooltip/Tooltip'

type Props<A> = Omit<LinkProps, 'disabled'> & {
  parser: Parser<A>
  tooltip?: React.ReactNode
}

export function HighlightLink<A>({
  parser,
  tooltip,
  className,
  ...props
}: Props<A>): React.ReactElement {
  const { matchLocation } = useHistory()

  const ref = useRef<HTMLAnchorElement>(null)

  const matches = Maybe.isSome(matchLocation(parser))

  return (
    <>
      <Link
        ref={ref}
        {...props}
        disabled={matches}
        className={cx(
          'flex border-b py-1.5',
          matches ? 'border-goldenrod-bis' : 'border-transparent',
          className,
        )}
      />
      {tooltip !== undefined ? <Tooltip hoverRef={ref}>{tooltip}</Tooltip> : null}
    </>
  )
}
