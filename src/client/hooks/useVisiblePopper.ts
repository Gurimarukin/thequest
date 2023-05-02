/* eslint-disable functional/no-expression-statements */
import { useEffect } from 'react'
import { usePopper } from 'react-popper'

export type ReactPopperParams = Parameters<typeof usePopper>
type ReactPopperReturnType = ReturnType<typeof usePopper>

/**
 * A wrapper around usePopper that recomputes popper position on visibility change
 * https://popper.js.org/docs/v2/modifiers/event-listeners/#when-the-reference-element-moves-or-changes-size
 */
export function useVisiblePopper(
  isVisible: boolean,
  referenceElement: ReactPopperParams[0] | undefined,
  popperElement: ReactPopperParams[1] | undefined,
  options: ReactPopperParams[2] | undefined,
): ReactPopperReturnType {
  const result = usePopper(referenceElement, popperElement, options)
  const { update } = result

  useEffect(() => {
    if (isVisible) update?.()
  }, [isVisible, update])

  return result
}
