/* eslint-disable functional/no-expression-statements, functional/no-return-void */
import React, { cloneElement, createRef, useCallback, useEffect } from 'react'

import type { List } from '../../shared/utils/fp'

type Props = {
  onClickOutside: (e: Readonly<MouseEvent>) => void
}

export const ClickOutside: React.FC<Props> = ({ onClickOutside, children }) => {
  const refs = React.Children.map(children, () => createRef<Node>())

  const handleClick = useCallback(
    (e: Readonly<MouseEvent>) => {
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

  return React.Children.map(children, (elt, idx) =>
    cloneElement(elt as React.ReactElement, {
      ref: (refs as List<React.RefObject<Node>>)[idx],
    }),
  ) as unknown as React.ReactElement
}
