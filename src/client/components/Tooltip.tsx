/* eslint-disable functional/no-expression-statements */
import React, { useCallback, useRef, useState } from 'react'

import { cssClasses } from '../utils/cssClasses'

type Props = {
  tooltip: React.ReactNode
  childrenClassName?: string
  className?: string
}

export const Tooltip: React.FC<Props> = ({ tooltip, childrenClassName, className, children }) => {
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
        className="absolute top-full left-1/2 z-50 hidden opacity-0 blur duration-300 peer-hover:flex peer-hover:opacity-100 peer-hover:blur-0"
      >
        <span className="-ml-1 flex h-1 w-1 border-r-[6px] border-t-[6px] border-r-mastery4-brown-secondary border-t-transparent" />
        <span className="flex h-1 w-1 border-l-[6px] border-t-[6px] border-l-mastery4-brown-secondary border-t-transparent" />
        <div
          // ref={elt => {
          //   if (elt === null) return
          //   console.log('elt.getBoundingClientRect() =', elt.getBoundingClientRect())
          //   // console.log('elt =', elt)
          //   // console.log('getWindowTop(elt) =', getWindowTop(elt))
          //   // console.log('getWindowLeft(elt) =', getWindowLeft(elt))
          // }}
          className="relative top-[6px] whitespace-nowrap border border-mastery4-brown-secondary bg-zinc-900 py-1 px-2 text-xs text-wheat"
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

  // const halfWidth = Math.round(eltRect.width / 2)
  // const diff = Math.round(documentRect.width - tooltipMargin - eltRect.right - halfWidth)
  // console.log('diff =', diff)
  // console.log('left =', diff < 0 ? diff + halfWidth : '-50%')
  // return { left: diff < 0 ? diff + halfWidth : '-50%' }

  const halfWidth = Math.round(eltRect.width / 2)
  const diff = docRect.width - tooltipMargin - (eltRect.left + halfWidth)
  return { left: -halfWidth + Math.min(diff, 0) }
}

// type NumberKey = Extract<keyof HTMLElement, 'offsetTop' | 'offsetLeft'>
// type Direction  ='top' | 'left'

// const getWindowsPos = (direction: Direction) => (elt: HTMLElement) => getWindowPosRec(direction, elt, 0)

// const getWindowPosRec = (direction: Direction, elt: Element | null, isFirst: boolean, acc: number): number => {
//   if (elt === null || !(elt instanceof HTMLElement)) return acc
//   return getWindowPosRec(key, elt.offsetParent, acc + elt[key])
// }

// const incr = (direction: Direction, elt: HTMLElement, isFirst: boolean) : number => {
//   switch (direction) {
//     case 'top':
//       return isFirst  ?   elt.offsetTop: elt.offsetTop + elt.offsetHeight
//     case 'left':
//     return elt.
//   }
// }

// const getWindowTop = getWindowsPos('offsetTop')
// const getWindowLeft = getWindowsPos('offsetLeft')
