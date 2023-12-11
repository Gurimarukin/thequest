import type { Parser } from 'fp-ts-routing'
import { useRef } from 'react'

import { usePathMatch } from '../../hooks/usePathMatch'
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
  const ref = useRef<HTMLAnchorElement>(null)

  const matches = usePathMatch(parser) !== undefined

  return (
    <>
      <Link
        ref={ref}
        {...props}
        disabled={matches}
        className={cx(
          'flex border-y border-t-transparent font-medium',
          matches ? 'border-b-goldenrod-bis' : 'border-b-transparent',
          className,
        )}
      />
      {tooltip !== undefined ? <Tooltip hoverRef={ref}>{tooltip}</Tooltip> : null}
    </>
  )
}
