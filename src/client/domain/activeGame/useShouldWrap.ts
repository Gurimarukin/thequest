/* eslint-disable functional/no-expression-statements,
                  functional/no-return-void */
import { useCallback, useEffect, useRef, useState } from 'react'

type ShouldWrap = {
  shouldWrap: boolean
  onMountLeft: (e: HTMLElement | null) => void
  onMountRight: (e: HTMLElement | null) => void
}

export const useShouldWrap = (): ShouldWrap => {
  const [shouldWrap, setShouldWrap] = useState(false)

  const leftRef = useRef<HTMLElement | null>(null)
  const rightRef = useRef<HTMLElement | null>(null)

  const updateShouldWrap = useCallback(() => {
    const left = leftRef.current
    const right = rightRef.current

    if (left !== null && right !== null) {
      const leftWidth = left.offsetWidth

      setShouldWrap(shouldWrap_ => {
        if (shouldWrap_ && leftWidth < right.getBoundingClientRect().left) return false
        if (!shouldWrap_ && window.innerWidth < leftWidth + right.offsetWidth) return true
        return shouldWrap_
      })
    }
  }, [])

  useEffect(() => {
    window.addEventListener('resize', updateShouldWrap)
    return () => window.removeEventListener('resize', updateShouldWrap)
  }, [updateShouldWrap])

  return {
    shouldWrap,
    onMountLeft: useCallback(
      (e: HTMLElement | null) => {
        // eslint-disable-next-line functional/immutable-data
        leftRef.current = e
        updateShouldWrap()
      },
      [updateShouldWrap],
    ),
    onMountRight: useCallback(
      (e: HTMLElement | null) => {
        // eslint-disable-next-line functional/immutable-data
        rightRef.current = e
        updateShouldWrap()
      },
      [updateShouldWrap],
    ),
  }
}
