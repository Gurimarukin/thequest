/* eslint-disable functional/no-expression-statements */
import React, { useCallback, useRef, useState } from 'react'

import { CaretUpSharp } from '../imgs/svgIcons'
import { cssClasses } from '../utils/cssClasses'

type Props = {
  tooltip: React.ReactNode
  /**
   * @default 'bottom'
   */
  position?: 'bottom' | 'top'
  childrenClassName?: string
  className?: string
}

export const Tooltip: React.FC<Props> = ({
  tooltip,
  position = 'bottom',
  childrenClassName,
  className,
  children,
}) => {
  const ref = useRef<HTMLDivElement>(null)

  const [style, setStyle] = useState<React.CSSProperties>({})

  const handleMouseEnter = useCallback(() => {
    if (ref.current !== null) setStyle(getStyles(ref.current))
  }, [])

  return (
    <div className={cssClasses('relative', className)}>
      <span onMouseEnter={handleMouseEnter} className={cssClasses('peer', childrenClassName)}>
        {children}
      </span>
      <div
        ref={ref}
        className={cssClasses(
          // opacity-0 blur duration-300 peer-hover:opacity-100 peer-hover:blur-0
          'absolute left-1/2 z-50 hidden peer-hover:flex',
          ['bottom-full', position === 'top'],
        )}
      >
        <CaretUpSharp
          className={cssClasses(
            'absolute left-[-7px] h-[14px] fill-mastery4-brown-secondary',
            ['top-[-3px]', position === 'bottom'],
            ['bottom-[-3px] rotate-180', position === 'top'],
          )}
        />
        <div
          className={cssClasses(
            'relative whitespace-nowrap border border-mastery4-brown-secondary bg-zinc-900 py-1 px-2 text-xs text-wheat',
            ['top-[7px]', position === 'bottom'],
            ['bottom-[7px]', position === 'top'],
          )}
          style={style}
        >
          {tooltip}
        </div>
      </div>
    </div>
  )
}

// add some spacing to the tooltip if close to edge
const tooltipMargin = 12 // px

const getStyles = (elt: HTMLElement): React.CSSProperties => {
  const eltRect = elt.getBoundingClientRect()
  const docRect = window.document.documentElement.getBoundingClientRect()

  const halfWidth = Math.round(eltRect.width / 2)
  const diffRight = docRect.width - tooltipMargin - (eltRect.left + halfWidth)
  const diffLeft = eltRect.left - halfWidth

  return { left: -Math.min(diffLeft, 0) - halfWidth + Math.min(diffRight, 0) }
}
