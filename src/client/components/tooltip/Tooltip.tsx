/* eslint-disable functional/no-expression-statements,
                  functional/no-return-void */
import type { Placement } from '@popperjs/core'
import type { MutableRefObject, RefObject } from 'react'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { MsDuration } from '../../../shared/models/MsDuration'
import { NonEmptyArray } from '../../../shared/utils/fp'

import { useForceRender } from '../../hooks/useForceRender'
import type { ReactPopperParams } from '../../hooks/useVisiblePopper'
import { useVisiblePopper } from '../../hooks/useVisiblePopper'
import { CaretUpSharp } from '../../imgs/svgIcons'
import { cssClasses } from '../../utils/cssClasses'

const tooltipLayerId = 'tooltip-layer'

const tooltipLayer = document.getElementById(tooltipLayerId)

if (tooltipLayer === null) {
  // eslint-disable-next-line functional/no-throw-statements
  throw Error(`Tooltip layer not found: #${tooltipLayerId}`)
}

type Props = {
  hoverRef: RefObject<Element> | NonEmptyArray<RefObject<Element>>
  /**
   * Place the tooltip from this element.
   * @default hoverRef
   */
  placementRef?: RefObject<Element>
  /**
   * Time spent open by the tooltip after the user navigates away from it / the hover (tablet).
   */
  openedDuration?: MsDuration
  placement?: Placement
  alwaysVisible?: boolean
  className?: string
}

export const Tooltip: React.FC<Props> = ({
  hoverRef: hoverRef_,
  placementRef: maybePlacementRef,
  openedDuration = MsDuration.seconds(3),
  placement = 'bottom',
  alwaysVisible = false,
  className,
  children,
}) => {
  const hoverRefs_ = isArray(hoverRef_) ? hoverRef_ : NonEmptyArray.of(hoverRef_)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const hoverRefs = useMemo(() => hoverRefs_, hoverRefs_)
  const placementRef_ = maybePlacementRef ?? NonEmptyArray.head(hoverRefs)

  const shouldDisplayRef = useRef(false)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const arrowRef = useRef<HTMLDivElement>(null)

  const shouldDisplay = alwaysVisible || shouldDisplayRef.current

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
    placementRef_.current,
    tooltipRef.current,
    options,
  )

  const setupHoverClickListeners = useSetupHoverClickListeners(
    hoverRefs,
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
        'group z-40 whitespace-nowrap border border-mastery4-brown-secondary bg-zinc-900 py-1 px-2 text-xs text-wheat shadow-even shadow-black transition-opacity duration-300',
        ['visible opacity-100', shouldDisplay],
        ['invisible opacity-0', !shouldDisplay],
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
 * Returns a function that adds 'click' and 'mouseover/mouseleave' event listeners on 'hoverRef'.
 * Those listeners will mutate `shouldDisplayRef` inner value to control whether or not the tooltip should be displayed.
 */
const useSetupHoverClickListeners = (
  hoverRefs: NonEmptyArray<RefObject<Element>>,
  shouldDisplayRef: MutableRefObject<boolean>,
  openedDuration: MsDuration,
  setEventListenersEnabled: React.Dispatch<React.SetStateAction<boolean>>,
): (() => void) => {
  const forceRender = useForceRender()

  return useCallback(() => {
    const hovers = hoverRefs.map(r => r.current)

    // eslint-disable-next-line functional/no-let
    let timer: number | undefined

    function showTooltip(): void {
      if (hovers.every(h => h === null)) return
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

    hovers.forEach(hover => {
      if (hover === null) return

      // React to hover in / out for desktop users.
      hover.addEventListener('mouseover', showTooltip, true)
      hover.addEventListener('mouseleave', hideTooltip, true)

      // React to click / tap for tablet users.
      hover.addEventListener('click', clickTooltip, true)
    })

    return () => {
      window.clearTimeout(timer)
      hovers.forEach(hover => {
        if (hover === null) return

        hover.removeEventListener('click', clickTooltip, true)
        hover.removeEventListener('mouseover', showTooltip, true)
        hover.removeEventListener('mouseleave', hideTooltip, true)
      })
    }
  }, [forceRender, hoverRefs, openedDuration, setEventListenersEnabled, shouldDisplayRef])
}

function isArray<A>(a: A | NonEmptyArray<A>): a is NonEmptyArray<A> {
  return Array.isArray(a)
}
