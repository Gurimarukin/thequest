import React from 'react'

import { cssClasses } from '../utils/cssClasses'

type Props = {
  readonly title: React.ReactNode
  readonly className?: string
}

export const Tooltip: React.FC<Props> = ({ title, className, children }) => (
  <div className={cssClasses('group relative', className)}>
    {children}
    <div className="invisible absolute top-[calc(100%_+_2px)] left-1/2 z-50 opacity-0 blur duration-300 group-hover:visible group-hover:opacity-100 group-hover:blur-0">
      <div
        ref={elt => {
          if (elt === null) return
          console.log('getWindowTop(elt) =', getWindowTop(elt))
          console.log('getWindowLeft(elt) =', getWindowLeft(elt))
        }}
        className="relative -left-1/2 flex rounded bg-zinc-900 py-2 px-3 text-sm"
      >
        {title}
      </div>
    </div>
  </div>
)

type NumberKey = Extract<keyof HTMLElement, 'offsetTop' | 'offsetLeft'>

const getWindowsPos = (key: NumberKey) => (elt: HTMLElement) => getWindowPosRec(key, elt, 0)

const getWindowPosRec = (key: NumberKey, elt: Element | null, acc: number): number => {
  if (elt === null || !(elt instanceof HTMLElement)) return acc
  return getWindowPosRec(key, elt.offsetParent, acc + elt[key])
}

const getWindowTop = getWindowsPos('offsetTop')
const getWindowLeft = getWindowsPos('offsetLeft')
