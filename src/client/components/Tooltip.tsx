/* eslint-disable functional/no-expression-statements,
                  functional/no-return-void */
import type { Placement } from '@popperjs/core'
import type { MutableRefObject, RefObject } from 'react'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { MsDuration } from '../../shared/models/MsDuration'

import { useForceRender } from '../hooks/useForceRender'
import type { ReactPopperParams } from '../hooks/useVisiblePopper'
import { useVisiblePopper } from '../hooks/useVisiblePopper'
import { CaretUpSharp } from '../imgs/svgIcons'
import { cssClasses } from '../utils/cssClasses'

export const tooltipLayerId = 'tooltip-layer'

type Props = {
  anchorRef: RefObject<Element>
  /**
   * Time spent open by the tooltip after the user navigates away from it / the anchor (tablet).
   */
  openedDuration?: MsDuration
  placement?: Placement
  className?: string
}

export const Tooltip: React.FC<Props> = ({
  anchorRef,
  openedDuration = MsDuration.seconds(3),
  placement = 'bottom',
  className,
  children,
}) => {
  const tooltipLayer = document.getElementById(tooltipLayerId)

  if (tooltipLayer === null) {
    // eslint-disable-next-line functional/no-throw-statements
    throw Error(`Tooltip layer not found: #${tooltipLayerId}`)
  }

  const shouldDisplayRef = useRef(false)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const arrowRef = useRef<HTMLDivElement>(null)

  const shouldDisplay = shouldDisplayRef.current

  const [eventListenersEnabled, setEventListenersEnabled] = useState(false)
  const options = useMemo(
    (): ReactPopperParams[2] => ({
      placement,
      modifiers: [
        { name: 'arrow', options: { element: arrowRef.current } },
        { name: 'offset', options: { offset: [0, 8] } },
        { name: 'preventOverflow', options: { padding: 8 } },
        // { name: 'flip', options: { padding: 8 } },
        { name: 'eventListeners', enabled: eventListenersEnabled },
      ],
    }),
    [eventListenersEnabled, placement],
  )
  const { styles, attributes } = useVisiblePopper(
    shouldDisplay,
    anchorRef.current,
    tooltipRef.current,
    options,
  )

  const setupHoverClickListeners = useSetupHoverClickListeners(
    anchorRef,
    shouldDisplayRef,
    openedDuration,
    setEventListenersEnabled,
  )

  // Set hover / click listeners to display or hide the tooltip.
  useEffect(setupHoverClickListeners, [setupHoverClickListeners])

  return createPortal(
    <div
      ref={tooltipRef}
      className={cssClasses(
        'group whitespace-nowrap border border-mastery4-brown-secondary bg-zinc-900 py-1 px-2 text-xs text-wheat shadow-even shadow-black',
        ['visible', shouldDisplay],
        ['invisible', !shouldDisplay],
        className,
      )}
      style={styles['popper']}
      {...attributes['popper']}
    >
      {children}
      <div
        ref={arrowRef}
        className="group-data-popper-top:bottom-[-11px] group-data-popper-bottom:top-[-11px] group-data-popper-left:right-[-11px] group-data-popper-right:left-[-11px]"
        style={styles['arrow']}
      >
        <CaretUpSharp
          className={cssClasses(
            'h-[14px] fill-mastery4-brown-secondary group-data-popper-top:rotate-180',
            ['group-data-popper-bottom:rotate-0', placement.startsWith('top')],
            [
              'group-data-popper-left:rotate-90 group-data-popper-right:-rotate-90',
              placement.startsWith('right'),
            ],
            [
              'group-data-popper-left:rotate-90 group-data-popper-right:-rotate-90',
              placement.startsWith('left'),
            ],
          )}
        />
      </div>
    </div>,
    tooltipLayer,
  )
}

/**
 * Returns a function that adds 'click' and 'mouseover/mouseleave' event listeners on 'anchorRef'.
 * Those listeners will mutate `shouldDisplayRef` inner value to control whether or not the tooltip should be displayed.
 */
const useSetupHoverClickListeners = (
  anchorRef: RefObject<Element | null>,
  shouldDisplayRef: MutableRefObject<boolean>,
  openedDuration: MsDuration,
  setEventListenersEnabled: React.Dispatch<React.SetStateAction<boolean>>,
): (() => void) => {
  const forceRender = useForceRender()

  return useCallback(() => {
    const anchor = anchorRef.current
    if (anchor === null) return

    // eslint-disable-next-line functional/no-let
    let timer: number | undefined

    function showTooltip(): void {
      if (anchor === null) return
      window.clearTimeout(timer)
      setEventListenersEnabled(true)

      // eslint-disable-next-line functional/immutable-data
      if (!shouldDisplayRef.current) shouldDisplayRef.current = true

      forceRender()
    }

    function hideTooltip(): void {
      window.clearTimeout(timer)
      setEventListenersEnabled(false)

      if (!shouldDisplayRef.current) return

      // eslint-disable-next-line functional/immutable-data
      shouldDisplayRef.current = false
      forceRender()
    }

    function clickTooltip(): void {
      showTooltip()

      // And hide it afterwards.
      timer = window.setTimeout(() => {
        hideTooltip()
      }, MsDuration.unwrap(openedDuration))
    }

    // React to hover in / out for desktop users.
    anchor.addEventListener('mouseover', showTooltip, true)
    anchor.addEventListener('mouseleave', hideTooltip, true)

    // React to click / tap for tablet users.
    anchor.addEventListener('click', clickTooltip, true)

    return () => {
      window.clearTimeout(timer)
      anchor.removeEventListener('click', clickTooltip, true)
      anchor.removeEventListener('mouseover', showTooltip, true)
      anchor.removeEventListener('mouseleave', hideTooltip, true)
    }
  }, [anchorRef, forceRender, openedDuration, setEventListenersEnabled, shouldDisplayRef])
}
