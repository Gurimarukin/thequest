/* eslint-disable functional/no-expression-statements,
                  functional/no-return-void */
import { Children, cloneElement, createRef, useCallback, useEffect } from 'react'

import type { List } from '../../shared/utils/fp'

type Props = {
  onClickOutside: (e: MouseEvent) => void
  children?: React.ReactElement | List<React.ReactElement>
}

export const ClickOutside: React.FC<Props> = ({ onClickOutside, children }) => {
  const refs = Children.map(children, () => createRef<Node>())

  const handleClick = useCallback(
    (e: MouseEvent) => {
      const isOutside = (refs as List<React.RefObject<Node>>).every(
        ref => ref.current !== null && !ref.current.contains(e.target as Node),
      )
      if (isOutside) onClickOutside(e)
    },
    [onClickOutside, refs],
  )

  useEffect(() => {
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [handleClick])

  return Children.map(children, (elt, idx) =>
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    cloneElement(elt!, {
      ref: (refs as List<React.RefObject<Node>>)[idx],
    }),
  ) as unknown as React.ReactElement
}
