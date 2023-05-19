import type { Parser } from 'fp-ts-routing'
import { useRef } from 'react'

import { Maybe } from '../../../shared/utils/fp'

import { useHistory } from '../../contexts/HistoryContext'
import { cssClasses } from '../../utils/cssClasses'
import type { LinkProps } from '../Link'
import { Link } from '../Link'
import { Tooltip } from '../tooltip/Tooltip'

type Props<A> = LinkProps & {
  parser: Parser<A>
  tooltip?: React.ReactNode
}

export function HighlightLink<A>({
  parser,
  tooltip,
  className,
  ...props
}: Props<A>): React.JSX.Element {
  const { matchLocation } = useHistory()

  const ref = useRef<HTMLAnchorElement>(null)

  return (
    <>
      <Link
        ref={ref}
        {...props}
        className={cssClasses(
          'flex py-3',
          ['border-b border-goldenrod-bis', Maybe.isSome(matchLocation(parser))],
          className,
        )}
      />
      {tooltip !== undefined ? <Tooltip hoverRef={ref}>{tooltip}</Tooltip> : null}
    </>
  )
}
